import { Router, Request, Response } from 'express';
import { activeBots, handleTelegramWebhook, getTelegramBotStatus, setupTelegramWebhook } from '../services/telegram';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Helper to get string param
const getTokenParam = (param: string | string[]): string => Array.isArray(param) ? param[0] : param;

// ===========================================
// TELEGRAM WEBHOOK - Zero Tolerance for Failure
// ===========================================

router.post('/webhook/:token', async (req: Request, res: Response) => {
    const token = getTokenParam(req.params.token);
    
    // Always respond quickly to Telegram (required for webhook acknowledgment)
    res.status(200).send('OK');
    
    // Process in background but with full error handling
    try {
        const result = await handleTelegramWebhook(token, req.body);
        
        if (!result.success) {
            console.error(`[TELEGRAM ROUTE] Webhook failed: ${result.error}`);
        }
    } catch (error: any) {
        console.error(`[TELEGRAM ROUTE] Unhandled error: ${error.message}`);
    }
});

// ===========================================
// TELEGRAM STATUS - Diagnostics Endpoint
// ===========================================

router.get('/status/:token', async (req: Request, res: Response) => {
    try {
        const token = getTokenParam(req.params.token);
        const status = await getTelegramBotStatus(token);
        
        res.json({
            success: true,
            ...status
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// TELEGRAM STATUS FOR BUSINESS - Auth required, own business only
// ===========================================

router.get('/business-status/:businessId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const businessId = getTokenParam(req.params.businessId);
        if (req.businessId !== businessId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: {
                id: true,
                name: true,
                telegramBotToken: true,
                telegramBotUsername: true,
                lastMessageAt: true,
                messageCount: true
            }
        });
        
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        
        if (!business.telegramBotToken) {
            return res.json({
                connected: false,
                message: 'No bot token configured'
            });
        }
        
        // Get live status from Telegram API
        const botStatus = await getTelegramBotStatus(business.telegramBotToken);
        
        res.json({
            connected: botStatus.healthy,
            webhookConfigured: botStatus.webhookConfigured,
            webhookUrl: botStatus.webhookUrl,
            lastMessageAt: business.lastMessageAt,
            messageCount: business.messageCount,
            botInfo: botStatus.botInfo,
            pendingUpdates: botStatus.pendingUpdates,
            lastError: botStatus.lastError
        });
    } catch (error: any) {
        console.error('[TELEGRAM BUSINESS STATUS] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// REGISTER WEBHOOK - Ensure webhook is set up
// ===========================================

router.post('/register-webhook/:businessId', async (req: Request, res: Response) => {
    try {
        const businessId = getTokenParam(req.params.businessId);
        const { backendUrl } = req.body;
        
        if (!backendUrl) {
            return res.status(400).json({ error: 'backendUrl is required' });
        }
        
        const business = await prisma.business.findUnique({
            where: { id: businessId }
        });
        
        if (!business?.telegramBotToken) {
            return res.status(400).json({ error: 'No Telegram bot token configured' });
        }
        
        const result = await setupTelegramWebhook(business.telegramBotToken, backendUrl);
        
        if (result.success) {
            res.json({ success: true, message: 'Webhook registered successfully' });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error: any) {
        console.error('[TELEGRAM REGISTER WEBHOOK] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
