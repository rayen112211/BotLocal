import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        // Calculate stats
        // 1. Messages Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const recentConversations = await prisma.conversation.findMany({
            where: { businessId, updatedAt: { gte: today } },
            orderBy: { updatedAt: 'desc' },
            take: 5
        });

        // Simplification: We will just count total conversations updated today as active, and bookings this week.
        const activeConversations = await prisma.conversation.count({
            where: { businessId, updatedAt: { gte: today } }
        });

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const bookingsThisWeek = await prisma.booking.count({
            where: { businessId, createdAt: { gte: oneWeekAgo } }
        });

        const reviewsCollected = await prisma.booking.count({
            where: { businessId, reviewSent: true }
        });

        const planKey = business.plan.toLowerCase();
        const planFeatures = global.PLAN_FEATURES?.[planKey] || global.PLAN_FEATURES?.starter;
        const limit = planFeatures?.features?.messages_per_month ?? Infinity;

        res.json({
            stats: {
                messagesUsed: business.messageCount,
                messageLimit: limit === Infinity ? 'Unlimited' : limit,
                usagePercent: limit === Infinity ? 0 : (business.messageCount / limit) * 100,
                activeConversations,
                bookingsThisWeek,
                reviewsCollected
            },
            recentConversations: recentConversations.map(c => {
                let lastMsg = "Conversation started";
                try {
                    const msgs = JSON.parse(c.messages);
                    if (msgs.length > 0) lastMsg = msgs[msgs.length - 1].content;
                } catch (e) { }

                return {
                    phone: c.customerPhone,
                    preview: lastMsg.substring(0, 50) + (lastMsg.length > 50 ? "..." : ""),
                    time: new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    lang: "🌐" // Language detection flag placeholder
                };
            })
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;
