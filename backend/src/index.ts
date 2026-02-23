import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import scannerRouter from './routes/scanner';
import bookingsRouter from './routes/bookings';
import stripeRouter from './routes/stripe';
import dashboardRouter from './routes/dashboard';
import businessRouter from './routes/business';
import conversationsRouter from './routes/conversations';
import telegramRouter from './routes/telegram';
import notificationsRouter from './routes/notifications';
import prisma from './lib/prisma';
import { handleTelegramWebhook } from './services/telegram';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL;

// 1. Rate Limiting (Global)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiter to all routes EXCEPT webhooks which can have burst traffic from single IPs (like Stripe or Telegram)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/telegram') || req.path.startsWith('/api/stripe')) {
        return next();
    }
    return limiter(req, res, next);
});

app.use(cors({
    origin: frontendUrl || '*',
    credentials: true,
}));

// Stripe webhook needs raw body - mount stripe router before json() so webhook handler gets raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/stripe', stripeRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug Telegram Webhook
app.post('/api/telegram/webhook', async (req, res) => {
    console.log('[TELEGRAM WEBHOOK] Message received:', JSON.stringify(req.body, null, 2));
    res.status(200).send('OK');
    try {
        const business = await prisma.business.findFirst({
            where: { telegramBotToken: { not: null } }
        });
        if (business && business.telegramBotToken) {
            handleTelegramWebhook(business.telegramBotToken, req.body).catch(console.error);
        }
    } catch (err) {
        console.error('[TELEGRAM WEBHOOK] Error processing fallback:', err);
    }
});

// Routes
import authRouter from './routes/auth';
import { authenticate } from './middleware/authMiddleware';

app.use('/api/auth', authRouter);
app.use('/api/scanner', authenticate, scannerRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/bookings', authenticate, bookingsRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/business', authenticate, businessRouter);
app.use('/api/conversations', authenticate, conversationsRouter);
app.use('/api/notifications', authenticate, notificationsRouter);

// ===========================================
// COMPREHENSIVE HEALTH ENDPOINTS
// ===========================================

// Basic health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Detailed health check - DB, Stripe, Telegram (count of configured bots)
app.get('/api/health/detailed', async (req: Request, res: Response) => {
    const health: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        timestamp: string;
        services: {
            database: { status: string; latency?: number; error?: string };
            stripe: { status: string; error?: string };
            telegram: { status: string; botsConfigured?: number; note?: string };
        };
    } = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: { status: 'unknown' },
            stripe: { status: 'unknown' },
            telegram: { status: 'unknown' }
        }
    };

    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        health.services.database = { status: 'healthy', latency: Date.now() - start };
    } catch (error: any) {
        health.services.database = { status: 'unhealthy', error: error.message };
        health.status = 'unhealthy';
    }

    if (process.env.STRIPE_SECRET_KEY) {
        try {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' });
            await stripe.balance.retrieve();
            health.services.stripe = { status: 'healthy' };
        } catch (error: any) {
            health.services.stripe = { status: 'unhealthy', error: error.message };
            health.status = 'degraded';
        }
    } else {
        health.services.stripe = { status: 'not_configured' };
    }

    try {
        const botsConfigured = await prisma.business.count({ where: { telegramBotToken: { not: null } } });
        health.services.telegram = {
            status: 'configured',
            botsConfigured,
            note: 'Per-bot status: GET /api/telegram/business-status/:businessId (auth required)'
        };
    } catch (error: any) {
        health.services.telegram = { status: 'error', note: error.message };
    }

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// System info endpoint
app.get('/api/system/status', async (req: Request, res: Response) => {
    try {
        // Get business count
        const businessCount = await prisma.business.count();

        // Get active bots (businesses with telegram tokens)
        const activeBots = await prisma.business.count({
            where: { telegramBotToken: { not: null } }
        });

        // Get total messages processed
        const businesses = await prisma.business.findMany({
            select: { messageCount: true }
        });
        const totalMessages = businesses.reduce((sum, b) => sum + b.messageCount, 0);

        // Get recent payment events
        const recentPayments = await prisma.paymentEvent.count({
            where: {
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            }
        });

        res.json({
            businessCount,
            activeBots,
            totalMessages,
            recentPayments,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[SYSTEM STATUS] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
