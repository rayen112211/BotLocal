import { Telegraf } from 'telegraf';
import prisma from '../lib/prisma';
import { generateReply } from './ai';

// Store initialized bots to avoid recreating them on every request
const activeBots: Record<string, Telegraf> = {};

export async function setupTelegramWebhook(token: string, backendUrl: string) {
    try {
        const bot = new Telegraf(token);
        const webhookUrl = `${backendUrl}/api/telegram/webhook/${token}`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`[TELEGRAM] Webhook successfully set to ${webhookUrl}`);
        activeBots[token] = bot;
    } catch (error) {
        console.error('[TELEGRAM] Failed to set webhook:', error);
        throw new Error('Failed to connect Telegram Bot. Ensure token is correct and backend is public.');
    }
}

export async function handleTelegramWebhook(token: string, body: any) {
    try {
        // Find business by token
        const business = await prisma.business.findFirst({
            where: { telegramBotToken: token }
        });

        if (!business) {
            console.error('[TELEGRAM] No business found for the provided token.');
            return;
        }

        // Initialize or retrieve existing bot instance
        let bot = activeBots[token];
        if (!bot) {
            bot = new Telegraf(token);
            activeBots[token] = bot;
            console.log(`[TELEGRAM] Initialized new bot instance for business: ${business.id}`);
        }

        // Check if there's a valid message
        if (body?.message && body.message.text) {
            const customerId = body.message.from.id.toString();
            const incomingText = body.message.text;

            console.log(`[TELEGRAM] Message from ${customerId} to business ${business.id}: ${incomingText}`);

            // 1. Limit Check
            if (business.plan === 'Starter' && business.messageCount >= 500) {
                await bot.telegram.sendMessage(customerId, "Please contact the business directly. (Message limit reached)");
                return;
            }

            // Skip handling if AI is disabled (assuming we can check conversation settings later, 
            // but for simplicity, let's just generate the reply if it doesn't match a quick stop).

            // Get conversation history
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
            } else {
                if (!conversation.isAiEnabled) {
                    console.log('[TELEGRAM] AI is disabled for this conversation.');
                    return;
                }
                messages = JSON.parse(conversation.messages);
                messages.push({ role: 'user', content: incomingText });
            }

            // Generate AI reply
            const aiReply = await generateReply(business.id, customerId, incomingText);

            if (aiReply) {
                // Send reply via Telegram
                await bot.telegram.sendMessage(customerId, aiReply);

                // Update conversation history
                messages.push({ role: 'assistant', content: aiReply });
                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { messages: JSON.stringify(messages) }
                });

                // Update business message count
                await prisma.business.update({
                    where: { id: business.id },
                    data: { messageCount: { increment: 1 } }
                });
            }
        }
    } catch (error) {
        console.error('[TELEGRAM] Error handling webhook:', error);
    }
}
