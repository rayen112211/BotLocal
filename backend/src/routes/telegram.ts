import { Router } from 'express';
import { activeBots, handleTelegramWebhook } from '../services/telegram';
import { Telegraf } from 'telegraf';

const router = Router();

// Telegram webhook endpoint
router.post('/webhook/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const body = req.body;

        // Ensure bot is initialized in memory so it can process the update
        let bot = activeBots[token];
        if (!bot) {
            bot = new Telegraf(token);
            activeBots[token] = bot;

            // Re-bind the message handler to this new instance since handleTelegramWebhook
            // expects the update to be processed by our custom logic.
        }

        // We can just call our handler directly since it already does the logic
        // We just need to make sure we return 200 OK immediately.
        res.status(200).send('OK');

        handleTelegramWebhook(token, body).catch(err => {
            console.error('[TELEGRAM ROUTE] Background processing error:', err);
        });

    } catch (error) {
        console.error('[TELEGRAM ROUTE] Webhook setup error:', error);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
});

// Debug endpoint to check webhook status for a given token
router.get('/status/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const bot = new Telegraf(token);
        const info = await bot.telegram.getWebhookInfo();
        res.json(info);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
