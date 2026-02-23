import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// ===========================================
// GET NOTIFICATIONS - For frontend polling
// ===========================================

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = await prisma.notification.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Last 50 notifications
        });

        const unreadCount = await prisma.notification.count({
            where: { businessId, read: false }
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error: any) {
        console.error('[NOTIFICATIONS] Get error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// MARK NOTIFICATION AS READ
// ===========================================

router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        const { id } = req.params;

        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify the notification belongs to this business
        const notification = await prisma.notification.findFirst({
            where: { id, businessId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.update({
            where: { id },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[NOTIFICATIONS] Mark read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// MARK ALL NOTIFICATIONS AS READ
// ===========================================

router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.notification.updateMany({
            where: { businessId, read: false },
            data: { read: true }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[NOTIFICATIONS] Mark all read error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// DELETE OLD NOTIFICATIONS (cleanup)
// ===========================================

router.delete('/cleanup', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { businessId } = req;
        if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

        // Delete notifications older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.notification.deleteMany({
            where: {
                businessId,
                createdAt: { lt: thirtyDaysAgo }
            }
        });

        res.json({ deleted: result.count });
    } catch (error: any) {
        console.error('[NOTIFICATIONS] Cleanup error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
