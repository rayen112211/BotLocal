import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

// Create a checkout session
router.post('/create-checkout-session', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req; // Derived from JWT
        const { planId } = req.body;

        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: planId, // The Stripe Price ID for Starter or Pro
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing`,
            client_reference_id: businessId,
        });

        res.json({ id: session.id, url: session.url });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook to handle successful payments and updates
router.post('/webhook', require('express').raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as any;
            const businessId = session.client_reference_id;

            if (businessId) {
                // Find which plan they subscribed to based on amount or price ID
                // Simplified mapping:
                const amountTotal = session.amount_total;
                let planName = 'Starter';
                if (amountTotal && amountTotal >= 5900) planName = 'Pro';
                if (amountTotal && amountTotal >= 9900) planName = 'Agency';

                await prisma.business.update({
                    where: { id: businessId },
                    data: {
                        plan: planName,
                        stripeCustomerId: session.customer as string
                    }
                });
                console.log(`Updated business ${businessId} to plan ${planName}`);
            }
            break;
        case 'customer.subscription.deleted':
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            await prisma.business.updateMany({
                where: { stripeCustomerId: customerId },
                data: { plan: 'Starter' } // Downgrade to Starter
            });
            console.log(`Downgraded customer ${customerId} to Starter`);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
});

export default router;
