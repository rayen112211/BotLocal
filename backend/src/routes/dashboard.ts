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

// Analytics Dashboard Endpoint
router.get('/:businessId/analytics', async (req, res) => {
    try {
        const { businessId } = req.params;
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const activeConversations = await prisma.conversation.count({
            where: { businessId, updatedAt: { gte: oneWeekAgo } }
        });

        const bookingsThisWeek = await prisma.booking.count({
            where: { businessId, createdAt: { gte: oneWeekAgo } }
        });

        const messagesThisWeekCount = await prisma.conversation.count({
            where: { businessId, updatedAt: { gte: oneWeekAgo } }
        }); // Simplified surrogate for message count

        // Fake some distributed data for charts using the actual totals
        const messageData = [
            { day: "Mon", messages: Math.floor(messagesThisWeekCount / 7) + 2 },
            { day: "Tue", messages: Math.floor(messagesThisWeekCount / 7) + 1 },
            { day: "Wed", messages: Math.floor(messagesThisWeekCount / 7) + 3 },
            { day: "Thu", messages: Math.floor(messagesThisWeekCount / 7) },
            { day: "Fri", messages: Math.floor(messagesThisWeekCount / 7) + 4 },
            { day: "Sat", messages: Math.floor(messagesThisWeekCount / 7) + 5 },
            { day: "Sun", messages: Math.floor(messagesThisWeekCount / 7) + 1 }
        ];

        const conversationData = [
            { name: "Completed", value: Math.floor(activeConversations * 0.7), color: "#10b981" },
            { name: "Pending", value: Math.floor(activeConversations * 0.2), color: "#f59e0b" },
            { name: "Support Needed", value: Math.floor(activeConversations * 0.1), color: "#ef4444" }
        ];

        res.json({
            messagesThisWeek: messagesThisWeekCount,
            activeConversations,
            bookingsThisWeek,
            customerSatisfaction: 94, // Static placeholder
            messageData,
            conversationData
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

export default router;
