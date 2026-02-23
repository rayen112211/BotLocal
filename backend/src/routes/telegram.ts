import { Router } from 'express';
import { handleTelegramWebhook } from '../services/telegram';

const router = Router();

// Telegram webhook endpoint
// Telegram webhooks require the token in the URL path to ensure security
// and know which bot received the message before parsing the body.
router.post('/webhook/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const body = req.body;

        // Telegram expects a 200 OK fast. Processing in background.
        res.status(200).send('OK');

        // Handle asynchronously so Telegram doesn't timeout
        handleTelegramWebhook(token, body).catch(err => {
            console.error('[TELEGRAM ROUTE] Background processing error:', err);
        });
    } catch (error) {
        console.error('[TELEGRAM ROUTE] Webhook setup error:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
