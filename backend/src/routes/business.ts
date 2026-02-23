import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get professional business settings
router.get('/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) return res.status(404).json({ error: 'Business not found' });
        res.json(business);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch business data' });
    }
});

// Update business settings for onboarding & settings page
router.patch('/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;
        const { industry, botPersonality, customInstructions, websiteUrl, name } = req.body;

        const updated = await prisma.business.update({
            where: { id: businessId },
            data: {
                industry,
                botPersonality,
                customInstructions,
                websiteUrl,
                name
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('[BUSINESS UPDATE ERROR]', error);
        res.status(500).json({ error: 'Failed to update business settings' });
    }
});

export default router;
