import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import scannerRouter from './routes/scanner';
import whatsappRouter from './routes/whatsapp';
import bookingsRouter from './routes/bookings';
import stripeRouter from './routes/stripe';
import dashboardRouter from './routes/dashboard';
import businessRouter from './routes/business';
import conversationsRouter from './routes/conversations';

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

// Apply rate limiter to all routes
app.use(limiter);

app.use(cors({
    origin: frontendUrl || '*',
    credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Twilio Webhooks

// Routes
import authRouter from './routes/auth';
import { authenticate } from './middleware/authMiddleware';

app.use('/api/auth', authRouter);
app.use('/api/scanner', authenticate, scannerRouter);
app.use('/api/whatsapp', whatsappRouter); // Webhook must be public
app.use('/api/bookings', authenticate, bookingsRouter);
app.use('/api/stripe', stripeRouter); // Webhook is inside this router, we'll protect sessions internally
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/business', authenticate, businessRouter);
app.use('/api/conversations', authenticate, conversationsRouter);

// Basic health route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
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
