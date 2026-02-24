import { Telegraf } from 'telegraf';
import prisma from '../lib/prisma';
import { generateReply, checkPlanLimit } from './ai';

// Store initialized bots to avoid recreating them on every request
export const activeBots: Record<string, Telegraf> = {};

// ===========================================
// TELEGRAM WEBHOOK SETUP - Guaranteed Delivery
// ===========================================

export async function setupTelegramWebhook(token: string, backendUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        const bot = new Telegraf(token);
        const webhookUrl = `https://botlocal.onrender.com/api/telegram/webhook`;

        // First, delete any existing webhook to ensure clean state
        await bot.telegram.deleteWebhook();

        // Set our webhook
        await bot.telegram.setWebhook(webhookUrl, {
            drop_pending_updates: true // Clear any pending updates when setting webhook
        });

        // Verify webhook was set correctly
        const webhookInfo = await bot.telegram.getWebhookInfo();

        if (webhookInfo.url !== webhookUrl) {
            console.error('[TELEGRAM] Webhook URL mismatch:', webhookInfo.url, '!=', webhookUrl);
            throw new Error('Webhook verification failed - URL mismatch');
        }

        // Test bot is actually accessible
        const botInfo = await bot.telegram.getMe();
        console.log(`[TELEGRAM] Bot connected: @${botInfo.username} (ID: ${botInfo.id})`);

        // Store bot instance
        activeBots[token] = bot;

        console.log(`[TELEGRAM] ✓ Webhook successfully set to ${webhookUrl}`);
        return { success: true };
    } catch (error: any) {
        console.error('[TELEGRAM] ✗ Failed to set webhook:', error.message);
        return { success: false, error: error.message || 'Failed to connect Telegram Bot. Ensure token is correct and backend is public.' };
    }
}

// ===========================================
// DIAGNOSTICS - Check bot health
// ===========================================

export async function getTelegramBotStatus(token: string): Promise<{
    healthy: boolean;
    webhookConfigured: boolean;
    webhookUrl?: string;
    lastError?: string;
    pendingUpdates: number;
    botInfo?: { id: number; username: string; first_name: string };
}> {
    try {
        const bot = new Telegraf(token);

        // Get webhook info
        const webhookInfo = await bot.telegram.getWebhookInfo();

        // Get bot info
        const botInfo = await bot.telegram.getMe();

        return {
            healthy: !!webhookInfo.url,
            webhookConfigured: !!webhookInfo.url,
            webhookUrl: webhookInfo.url,
            pendingUpdates: webhookInfo.pending_update_count || 0,
            botInfo: {
                id: botInfo.id,
                username: botInfo.username || 'unknown',
                first_name: botInfo.first_name || 'unknown'
            }
        };
    } catch (error: any) {
        return {
            healthy: false,
            webhookConfigured: false,
            lastError: error.message,
            pendingUpdates: 0
        };
    }
}

// ===========================================
// WEBHOOK HANDLER - Reliable Processing
// ===========================================

const FALLBACK_REPLY = 'Sorry, something went wrong. Please try again in a moment.';

export async function handleTelegramWebhook(token: string, body: any): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    const logPrefix = `[TELEGRAM] [${new Date().toISOString()}]`;
    const updateId = body?.update_id ?? '?';
    console.log(`${logPrefix} Update ${updateId} | token: ${token.substring(0, 8)}...`);

    try {
        const business = await prisma.business.findFirst({
            where: { telegramBotToken: token }
        });

        if (!business) {
            console.error(`${logPrefix} ✗ No business found for token`);
            return { success: false, error: 'No business associated with this token' };
        }

        console.log(`${logPrefix} Business: ${business.name} (ID: ${business.id})`);

        let bot = activeBots[token];
        if (!bot) {
            bot = new Telegraf(token);
            activeBots[token] = bot;
            console.log(`${logPrefix} Initialized new bot instance`);
        }

        if (!body?.message || !body.message.text) {
            console.log(`${logPrefix} Update ${updateId} no text message, skipping`);
            return { success: true };
        }

        const customerId = body.message.from.id.toString();
        const incomingText = body.message.text;
        const messageId = body.message.message_id;

        console.log(`${logPrefix} Update ${updateId} | from ${customerId}: "${incomingText.substring(0, 50)}${incomingText.length > 50 ? '...' : ''}"`);

        // 4. Update lastMessageAt for diagnostics
        await prisma.business.update({
            where: { id: business.id },
            data: { lastMessageAt: new Date() }
        });

        // 5. Check plan limits
        const limitCheck = checkPlanLimit(business);
        if (!limitCheck.allowed) {
            console.log(`${logPrefix} [LIMIT] ${business.name} hit message limit. ${limitCheck.message}`);

            // Avoid spamming notifications for every single blocked message
            // Create a notification for the owner if we haven't in the last 24h (optional logic check but for now we'll just create it)
            await prisma.notification.create({
                data: {
                    businessId: business.id,
                    type: 'error',
                    title: 'Message Limit Reached',
                    message: limitCheck.message
                }
            });

            await bot.telegram.sendMessage(
                customerId,
                "Sorry, this business has reached their message limit. They can continue next billing cycle."
            );
            return { success: true };
        }

        // 6. Get or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: { businessId: business.id, customerPhone: customerId }
        });

        let messages: { role: 'user' | 'assistant' | 'system', content: string }[] = [];

        if (!conversation) {
            // Create new conversation
            conversation = await prisma.conversation.create({
                data: {
                    businessId: business.id,
                    customerPhone: customerId,
                    messages: JSON.stringify([{ role: 'user', content: incomingText }])
                }
            });
            messages = [{ role: 'user', content: incomingText }];
            console.log(`${logPrefix} Created new conversation ${conversation.id}`);
        } else {
            if (!conversation.isAiEnabled) {
                console.log(`${logPrefix} AI disabled for conversation ${conversation.id}`);
                await bot.telegram.sendMessage(customerId, "AI replies are off for this chat. A team member will respond soon.");
                return { success: true };
            }

            // Parse existing messages
            try {
                messages = JSON.parse(conversation.messages);
            } catch (parseError) {
                console.error(`${logPrefix} Failed to parse messages, starting fresh`);
                messages = [];
            }
            messages.push({ role: 'user', content: incomingText });
        }

        console.log(`${logPrefix} Generating AI reply...`);
        let aiReply = await generateReply(business.id, customerId, incomingText);
        if (!aiReply?.trim()) {
            console.error(`${logPrefix} AI reply empty, using fallback`);
            aiReply = FALLBACK_REPLY;
        }

        console.log(`${logPrefix} Sending reply to customer ${customerId}...`);
        await bot.telegram.sendMessage(customerId, aiReply);

        // 9. Update conversation history
        messages.push({ role: 'assistant', content: aiReply });
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { messages: JSON.stringify(messages) }
        });

        // 10. Atomically increment message count
        await prisma.business.update({
            where: { id: business.id },
            data: { messageCount: { increment: 1 } }
        });

        const duration = Date.now() - startTime;
        console.log(`${logPrefix} ✓ Message processed successfully in ${duration}ms`);

        return { success: true };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`${logPrefix} ✗ Error after ${duration}ms:`, error.message);
        console.error(`${logPrefix} Stack:`, error.stack);
        try {
            const bot = activeBots[token] ?? new Telegraf(token);
            const customerId = body?.message?.from?.id?.toString();
            if (customerId) await bot.telegram.sendMessage(customerId, FALLBACK_REPLY);
        } catch (sendErr: any) {
            console.error(`${logPrefix} Failed to send error reply:`, sendErr.message);
        }
        return { success: false, error: error.message };
    }
}

// ===========================================
// NOTIFICATION - Send message to user
// ===========================================

export async function sendTelegramNotification(businessId: string, message: string): Promise<boolean> {
    try {
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business?.telegramBotToken) {
            console.error('[TELEGRAM] No bot token for business', businessId);
            return false;
        }

        let bot = activeBots[business.telegramBotToken];
        if (!bot) {
            bot = new Telegraf(business.telegramBotToken);
            activeBots[business.telegramBotToken] = bot;
        }

        // For now, we can't notify the business owner via Telegram without their chat ID
        // This would require storing ownerChatId when they connect the bot
        console.log('[TELEGRAM] Notification requested but owner chat ID not stored');
        return false;
    } catch (error: any) {
        console.error('[TELEGRAM] Notification error:', error.message);
        return false;
    }
}
