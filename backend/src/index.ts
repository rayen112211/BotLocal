import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import scannerRouter from './routes/scanner';
import whatsappRouter from './routes/whatsapp';
import bookingsRouter from './routes/bookings';
import stripeRouter from './routes/stripe';
import dashboardRouter from './routes/dashboard';
import businessRouter from './routes/business';
import conversationsRouter from './routes/conversations';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Twilio Webhooks

// Routes
import authRouter from './routes/auth';
import { authenticate } from './middleware/authMiddleware';

app.use('/api/auth', authRouter);
app.use('/api/scanner', scannerRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/dashboard', authenticate, dashboardRouter);
app.use('/api/business', authenticate, businessRouter);
app.use('/api/conversations', authenticate, conversationsRouter);

// Basic health route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Chatbot Buddy Backend running.' });
});

// Mock environment variables for local testing
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "gsk_test";
process.env.HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || "hf_test";

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
