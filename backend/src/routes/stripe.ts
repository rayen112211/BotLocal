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
// PROCESS STRIPE EVENT - Idempotent Handler
// Exported so it can be used by the raw webhook handler in index.ts
// ===========================================

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
    const eventId = event.id;
    const eventType = event.type;

    // Check memory first (fastest duplicate prevention)
    if (processedWebhooks.has(eventId)) {
        console.log(`[STRIPE] Webhook already processed in memory: ${eventId}`);
        return;
    }

    // Check for idempotency in DB - don't process same event twice
    const existingEvent = await prisma.paymentEvent.findUnique({
        where: { stripeEventId: eventId }
    });

    if (existingEvent) {
        console.log(`[STRIPE] Event ${eventId} already processed in DB, skipping`);
        processedWebhooks.add(eventId); // Sync memory
        return;
    }

    processedWebhooks.add(eventId); // Mark as processed in memory

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
            const businessId = session.metadata?.businessId || session.client_reference_id;
            const planId = session.metadata?.plan;

            if (!businessId) {
                console.error('[STRIPE] No business ID in checkout session metadata');
                return;
            }

            let planName = 'Starter';
            if (planId) {
                // Determine Plan name (e.g. "pro" -> "Pro")
                const foundPlanKey = Object.keys(global.STRIPE_PRICES || {}).find(
                    key => key === planId
                );

                if (foundPlanKey && global.PLAN_FEATURES && global.PLAN_FEATURES[foundPlanKey]) {
                    planName = global.PLAN_FEATURES[foundPlanKey].name;
                } else {
                    // Fallback
                    planName = planId.charAt(0).toUpperCase() + planId.slice(1);
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

            // Use actual paid amount mapping if needed or fallback to the session amount_total
            const PLAN_PRICES: Record<string, number> = {
                pro: 2999, // $29.99
                enterprise: 9999 // $99.99
            };
            const amountToSave = planId ? (PLAN_PRICES[planId.toLowerCase()] || session.amount_total) : session.amount_total;

            await prisma.paymentEvent.updateMany({
                where: { stripeEventId: eventId },
                data: { businessId, plan: planName, amount: amountToSave ?? undefined, status: 'processed' }
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
