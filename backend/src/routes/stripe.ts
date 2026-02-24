import express, { Router, Request, Response } from 'express';
import Stripe from 'stripe';

import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

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
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/pricing?payment=cancelled`,
            client_reference_id: businessId,
            metadata: {
                businessId: businessId,
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
// STRIPE WEBHOOK - Authoritative Payment Handler
// ===========================================

// Raw body is applied in index.ts for this path; do not parse JSON here
router.post('/webhook', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        console.error(`[STRIPE WEBHOOK] ✗ Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[STRIPE WEBHOOK] Received event: ${event.type}, ID: ${event.id}`);

    // Handle the event - MONEY = TRUTH
    try {
        await handleStripeEvent(event);
    } catch (error: any) {
        console.error(`[STRIPE WEBHOOK] ✗ Error processing event ${event.id}: ${error.message}`);
        // Return 500 to Stripe to trigger retry
        return res.status(500).json({ error: 'Failed to process webhook' });
    }

    res.json({ received: true });
});

// ===========================================
// PROCESS STRIPE EVENT - Idempotent Handler
// ===========================================

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
    const eventId = event.id;
    const eventType = event.type;

    // Check for idempotency - don't process same event twice
    const existingEvent = await prisma.paymentEvent.findUnique({
        where: { stripeEventId: eventId }
    });

    if (existingEvent) {
        console.log(`[STRIPE] Event ${eventId} already processed, skipping`);
        return;
    }

    await prisma.paymentEvent.create({
        data: {
            stripeEventId: eventId,
            type: eventType,
            status: 'processing',
            rawEvent: JSON.stringify(event)
        }
    });
    console.log(`[STRIPE] Persisted event ${eventId} (${eventType})`);

    switch (eventType) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const businessId = session.client_reference_id;

            if (!businessId) {
                console.error('[STRIPE] No business ID in checkout session');
                return;
            }

            // Get subscription to find the price/plan
            const subscriptionId = session.subscription as string;
            let planName = 'Starter';

            if (subscriptionId) {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const subscriptionItem = subscription.items.data[0];
                const priceId = subscriptionItem.price.id;

                // Map price ID to plan name dynamically
                const foundPlanKey = Object.keys(global.STRIPE_PRICES || {}).find(
                    key => global.STRIPE_PRICES[key] === priceId
                );

                if (foundPlanKey && global.PLAN_FEATURES && global.PLAN_FEATURES[foundPlanKey]) {
                    planName = global.PLAN_FEATURES[foundPlanKey].name;
                }
            }

            // Update business plan atomically
            await prisma.business.update({
                where: { id: businessId },
                data: {
                    plan: planName,
                    stripeCustomerId: session.customer as string
                }
            });

            await prisma.paymentEvent.updateMany({
                where: { stripeEventId: eventId },
                data: { businessId, plan: planName, amount: session.amount_total ?? undefined, status: 'processed' }
            });

            await prisma.notification.create({
                data: {
                    businessId: businessId,
                    type: 'payment',
                    title: 'Payment Successful!',
                    message: `Your subscription has been upgraded to ${planName}. You now have access to all ${planName} features.`
                }
            });

            console.log(`[STRIPE] ✓ Business ${businessId} upgraded to ${planName}`);
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Downgrade to Starter
            const result = await prisma.business.updateMany({
                where: { stripeCustomerId: customerId },
                data: { plan: 'Starter' }
            });

            if (result.count > 0) {
                // Find the business to notify
                const business = await prisma.business.findFirst({
                    where: { stripeCustomerId: customerId }
                });

                if (business) {
                    await prisma.notification.create({
                        data: {
                            businessId: business.id,
                            type: 'payment',
                            title: 'Subscription Cancelled',
                            message: 'Your subscription has been cancelled. You have been moved to the Starter plan.'
                        }
                    });
                }
            }

            await prisma.paymentEvent.updateMany({ where: { stripeEventId: eventId }, data: { status: 'processed' } });
            console.log(`[STRIPE] Customer ${customerId} downgraded to Starter`);
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            const business = await prisma.business.findFirst({
                where: { stripeCustomerId: customerId }
            });

            if (business) {
                await prisma.notification.create({
                    data: {
                        businessId: business.id,
                        type: 'error',
                        title: 'Payment Failed',
                        message: `Payment of ${(invoice.amount_due / 100).toFixed(2)} ${invoice.currency} failed. Please update your payment method.`
                    }
                });
            }

            await prisma.paymentEvent.updateMany({ where: { stripeEventId: eventId }, data: { status: 'processed' } });
            console.log(`[STRIPE] Payment failed for customer ${customerId}`);
            break;
        }

        default:
            await prisma.paymentEvent.updateMany({ where: { stripeEventId: eventId }, data: { status: 'processed' } });
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

        res.json({
            plan: business.plan,
            stripeCustomerId: business.stripeCustomerId,
            messageCount: business.messageCount,
            messageLimit: messageLimit,
            percentageUsed: messageLimit === Infinity ? 0 : Math.round((business.messageCount / messageLimit) * 100)
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
