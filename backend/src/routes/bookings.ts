import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const router = Router();
const prisma = new PrismaClient();

// Get all bookings for a business
router.get('/:businessId', async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { businessId: req.params.businessId },
            orderBy: { date: 'asc' }
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Mark booking as completed and send review request
router.post('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;

        // Update booking status
        const booking = await prisma.booking.update({
            where: { id },
            data: { status: 'completed' },
            include: { business: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Send WhatsApp Review Request
        if (!booking.reviewSent && booking.business.plan !== 'Starter') {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const mapsLink = booking.business.websiteUrl || "https://google.com/maps"; // Fallback to website if no dedicated maps link

            const message = await client.messages.create({
                body: `Hi ${booking.customerName}! Thank you for visiting ${booking.business.name}. We hope you had a great experience. Could you take a moment to leave us a review? 🌟\n\n${mapsLink}`,
                from: `whatsapp:${booking.business.twilioPhone || process.env.TWILIO_PHONE_NUMBER}`,
                to: `whatsapp:${booking.customerPhone}`
            });

            await prisma.booking.update({
                where: { id },
                data: { reviewSent: true }
            });

            console.log(`Review request sent to ${booking.customerPhone}: ${message.sid}`);
        }

        res.json({ success: true, booking });
    } catch (error: any) {
        console.error('Booking completion error:', error.message);
        res.status(500).json({ error: 'Failed to complete booking' });
    }
});

export default router;
