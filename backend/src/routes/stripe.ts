import express, { Router, Request, Response } from 'express';
import Stripe from 'stripe';

import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const processedWebhooks = new Set<string>();

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

// ===========================================
// PLAN PRICE IDS - Handled Dynamically Now
// ===========================================
// Prices are automatically created and stored in global.STRIPE_PRICES

// ===========================================
// CREATE CHECKOUT SESSION - Frontend calls this
// ===========================================

router.post('/create-checkout-session', express.json(), authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        const { planId } = req.body || {};

        if (!planId || !['starter', 'pro', 'agency', 'enterprise'].includes(planId)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        // Map planId to Stripe price ID dynamically
        const stripePriceId = global.STRIPE_PRICES?.[planId];

        if (!stripePriceId || stripePriceId === 'free') {
            return res.status(400).json({ error: 'Invalid plan selected or plan is free' });
        }

        // Create checkout session with price ID (not amount)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: business.email,
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
            client_reference_id: business.id,
            metadata: {
                businessId: business.id,
                plan: planId
            }
        });

        console.log(`[STRIPE] Created checkout session ${session.id} for business ${businessId}, plan: ${planId}`);
        res.json({ id: session.id, url: session.url });
    } catch (error: any) {
        console.error('[STRIPE] Create checkout error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// PROCESS STRIPE EVENT - Idempotent Handler
// Exported so it can be used by the raw webhook handler in index.ts
// ===========================================

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
    const eventId = event.id;
    const eventType = event.type;

    // Fast memory duplicate check
    if (processedWebhooks.has(eventId)) {
        return;
    }

    // Database duplicate check
    const existingEvent = await prisma.paymentEvent.findUnique({
        where: { stripeEventId: eventId }
    });

    if (existingEvent) {
        processedWebhooks.add(eventId);
        return;
    }
    processedWebhooks.add(eventId);

    // Only process what we know safely
    switch (eventType) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const businessId = session.metadata?.businessId;
            const planId = session.metadata?.plan;

            if (!businessId) {
                console.error('[STRIPE] No businessId in metadata');
                return;
            }

            let planName = 'Starter';
            if (planId) {
                const foundPlanKey = Object.keys(global.STRIPE_PRICES || {}).find(key => key === planId);
                if (foundPlanKey && global.PLAN_FEATURES && global.PLAN_FEATURES[foundPlanKey]) {
                    planName = global.PLAN_FEATURES[foundPlanKey].name;
                } else {
                    planName = planId.charAt(0).toUpperCase() + planId.slice(1);
                }
            }

            // USER REQUEST FIX: Unconditionally update the business plan
            await prisma.business.update({
                where: { id: businessId },
                data: {
                    plan: planId ? planId.toUpperCase() : planName.toUpperCase(),
                    stripeCustomerId: session.customer as string
                }
            });

            // Safely save the payment event now that we know businessId is solid
            const PLAN_PRICES: Record<string, number> = { pro: 2999, enterprise: 9999 };
            const amountToSave = planId ? (PLAN_PRICES[planId.toLowerCase()] || session.amount_total) : session.amount_total;

            await prisma.paymentEvent.create({
                data: {
                    stripeEventId: eventId,
                    type: eventType,
                    status: 'completed',
                    businessId: businessId,
                    plan: planName,
                    amount: amountToSave ?? undefined,
                    rawEvent: JSON.stringify(event)
                }
            });

            console.log(`[STRIPE] ✓ Business ${businessId} upgraded to ${planName}`);
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            const business = await prisma.business.findFirst({ where: { stripeCustomerId: customerId } });
            if (!business) return;

            await prisma.business.update({
                where: { id: business.id },
                data: { plan: 'Starter' }
            });
            console.log(`[STRIPE] Customer ${customerId} downgraded to Starter`);
            break;
        }

        default:
            console.log(`[STRIPE] Unhandled event type: ${eventType}`);
    }
}

// ===========================================
// GET SUBSCRIPTION STATUS - For frontend
// ===========================================

router.get('/subscription', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: {
                plan: true,
                stripeCustomerId: true,
                messageCount: true
            }
        });

        if (!business) return res.status(404).json({ error: 'Business not found' });

        const planKey = business.plan.toLowerCase();
        const planFeatures = global.PLAN_FEATURES?.[planKey] || global.PLAN_FEATURES?.starter;
        const messageLimit = planFeatures?.features?.messages_per_month ?? Infinity;

        const paymentEvents = await prisma.paymentEvent.findMany({
            where: { businessId, status: 'processed', type: 'checkout.session.completed' },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        res.json({
            plan: business.plan,
            stripeCustomerId: business.stripeCustomerId,
            messageCount: business.messageCount,
            messageLimit: messageLimit,
            percentageUsed: messageLimit === Infinity ? 0 : Math.round((business.messageCount / messageLimit) * 100),
            invoices: paymentEvents.map(event => ({
                id: event.id.substring(0, 8).toUpperCase(),
                date: event.createdAt,
                amount: event.amount || 0,
                status: "Paid",
                url: null
            }))
        });
    } catch (error: any) {
        console.error('[STRIPE] Get subscription error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// CREATE PORTAL SESSION - For managing subscription
// ===========================================

router.post('/create-portal-session', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        const business = await prisma.business.findUnique({
            where: { id: businessId }
        });

        if (!business?.stripeCustomerId) {
            return res.status(400).json({ error: 'No active subscription' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: business.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL}/dashboard/billing`
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('[STRIPE] Create portal session error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
