import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { businessUpdateSchema } from '../validation';
import { setupTelegramWebhook, getTelegramBotStatus } from '../services/telegram';

const router = Router();

// ===========================================
// GET BUSINESS SETTINGS
// ===========================================

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        if (!businessId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const business = await prisma.business.findUnique({ 
            where: { id: businessId },
            select: {
                id: true,
                email: true,
                name: true,
                websiteUrl: true,
                phone: true,
                telegramBotToken: true,
                telegramBotUsername: true,
                language: true,
                plan: true,
                industry: true,
                botPersonality: true,
                customInstructions: true,
                stripeCustomerId: true,
                messageCount: true,
                lastMessageAt: true,
                createdAt: true,
                updatedAt: true
            }
        });
        
        if (!business) return res.status(404).json({ error: 'Business not found' });
        
        // Get bot status if token exists
        let botStatus = null;
        if (business.telegramBotToken) {
            try {
                botStatus = await getTelegramBotStatus(business.telegramBotToken);
            } catch (e) {
                console.error('[BUSINESS] Failed to get bot status:', e);
            }
        }
        
        res.json({
            ...business,
            botStatus
        });
    } catch (error: any) {
        console.error('[BUSINESS GET] Error:', error);
        res.status(500).json({ error: 'Failed to fetch business data' });
    }
});

// ===========================================
// UPDATE BUSINESS SETTINGS
// ===========================================

const updateBusiness = async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        if (!businessId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const parsed = businessUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid business data', details: parsed.error.flatten() });
        }

        const newToken = parsed.data.telegramBotToken;
        const backendUrl = process.env.BACKEND_URL;

        // Guarantee webhook registration on every save when token is present
        if (newToken) {
            if (!backendUrl) {
                return res.status(500).json({
                    error: 'Backend URL not configured. Set BACKEND_URL so the bot can receive messages.',
                    code: 'BACKEND_URL_MISSING'
                });
            }
            const result = await setupTelegramWebhook(newToken, backendUrl);
            if (!result.success) {
                await prisma.notification.create({
                    data: {
                        businessId,
                        type: 'error',
                        title: 'Telegram Bot Connection Failed',
                        message: result.error || 'Failed to connect bot. Check your token and that the backend is publicly reachable.'
                    }
                });
                return res.status(400).json({
                    error: result.error || 'Failed to connect Telegram Bot',
                    code: 'TELEGRAM_SETUP_FAILED'
                });
            }
            await prisma.notification.create({
                data: {
                    businessId,
                    type: 'success',
                    title: 'Telegram Bot Connected',
                    message: 'Webhook registered. Your bot is ready to receive messages.'
                }
            });
        }

        // Update business data
        const updated = await prisma.business.update({
            where: { id: businessId },
            data: parsed.data,
        });

        res.json(updated);
    } catch (error: any) {
        console.error('[BUSINESS UPDATE ERROR]', error);
        res.status(500).json({ error: 'Failed to update business settings' });
    }
};

router.patch('/', authenticate, updateBusiness);
router.put('/', authenticate, updateBusiness);

export default router;
