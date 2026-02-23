import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET all bookings for a business
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        if (!businessId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const bookings = await prisma.booking.findMany({
            where: { businessId },
            orderBy: { date: 'desc' },
        });

        res.json({
            success: true,
            bookings: bookings.map(b => ({
                id: b.id,
                customerName: b.customerName,
                customerPhone: b.customerPhone,
                serviceType: b.serviceType || 'General Service',
                date: b.date.toISOString(),
                time: b.time,
                status: b.status,
                notes: b.notes,
                createdAt: b.createdAt.toISOString(),
            }))
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// GET single booking
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;

        const booking = await prisma.booking.findUnique({
            where: { id }
        });

        if (!booking || booking.businessId !== businessId) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({
            success: true,
            booking: {
                ...booking,
                date: booking.date.toISOString(),
                createdAt: booking.createdAt.toISOString(),
                updatedAt: booking.updatedAt.toISOString(),
            }
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// POST create new booking (from WhatsApp bot)
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const { customerName, customerPhone, serviceType, date, time, notes } = req.body;

        if (!customerName || !customerPhone || !date || !time) {
            return res.status(400).json({
                error: 'Missing required fields: customerName, customerPhone, date, time'
            });
        }

        const booking = await prisma.booking.create({
            data: {
                businessId: businessId!,
                customerName,
                customerPhone,
                serviceType: serviceType || 'General Service',
                date: new Date(date),
                time,
                notes: notes || null,
                status: 'pending'
            }
        });

        res.status(201).json({
            success: true,
            booking: {
                ...booking,
                date: booking.date.toISOString(),
                createdAt: booking.createdAt.toISOString(),
            },
            message: 'Booking created successfully'
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// PUT update booking
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;
        const { customerName, customerPhone, serviceType, date, time, status, notes } = req.body;

        // Check ownership
        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking || booking.businessId !== businessId) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const updated = await prisma.booking.update({
            where: { id },
            data: {
                ...(customerName && { customerName }),
                ...(customerPhone && { customerPhone }),
                ...(serviceType && { serviceType }),
                ...(date && { date: new Date(date) }),
                ...(time && { time }),
                ...(status && { status }),
                ...(notes !== undefined && { notes }),
            }
        });

        res.json({
            success: true,
            booking: {
                ...updated,
                date: updated.date.toISOString(),
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
            },
            message: 'Booking updated successfully'
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// DELETE booking
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking || booking.businessId !== businessId) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        await prisma.booking.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

// PATCH update booking status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking || booking.businessId !== businessId) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const updated = await prisma.booking.update({
            where: { id },
            data: { status }
        });

        res.json({
            success: true,
            booking: updated,
            message: `Booking status updated to ${status}`
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// POST send review request
router.post('/:id/send-review', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;

        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking || booking.businessId !== businessId) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({ error: 'Can only request reviews for completed bookings' });
        }

        // Update review sent flag
        await prisma.booking.update({
            where: { id },
            data: { reviewSent: true }
        });

        // TODO: Integrate with WhatsApp to send review request message
        // For now, just return success
        res.json({
            success: true,
            message: 'Review request sent to customer'
        });
    } catch (error) {
        console.error('Send review error:', error);
        res.status(500).json({ error: 'Failed to send review request' });
    }
});

// GET booking stats
router.get('/stats/summary', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;

        const total = await prisma.booking.count({ where: { businessId } });
        const pending = await prisma.booking.count({
            where: { businessId, status: 'pending' }
        });
        const completed = await prisma.booking.count({
            where: { businessId, status: 'completed' }
        });
        const withReviews = await prisma.booking.count({
            where: { businessId, reviewSent: true }
        });

        res.json({
            success: true,
            stats: {
                total,
                pending,
                completed,
                withReviews,
                reviewRate: total > 0 ? Math.round((withReviews / completed) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
