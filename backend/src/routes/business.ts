import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { businessUpdateSchema } from '../validation';

const router = Router();

// Get business settings for authenticated business
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        if (!businessId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        if (!business) return res.status(404).json({ error: 'Business not found' });
        res.json(business);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch business data' });
    }
});

// Update business settings for onboarding & settings page
// Update business settings for onboarding & settings page
const updateBusiness = async (req: AuthRequest, res: any) => {
    try {
        const { businessId } = req;
        if (!businessId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const parsed = businessUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid business data', details: parsed.error.flatten() });
        }

        const updated = await prisma.business.update({
            where: { id: businessId },
            data: parsed.data,
        });

        res.json(updated);
    } catch (error) {
        console.error('[BUSINESS UPDATE ERROR]', error);
        res.status(500).json({ error: 'Failed to update business settings' });
    }
};

router.patch('/', authenticate, updateBusiness);
router.put('/', authenticate, updateBusiness);

export default router;
