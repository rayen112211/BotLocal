import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existingBusiness = await prisma.business.findUnique({ where: { email } });
        if (existingBusiness) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const business = await prisma.business.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        const token = jwt.sign({ businessId: business.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            business: {
                id: business.id,
                email: business.email,
                name: business.name
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const business = await prisma.business.findUnique({ where: { email } });
        if (!business) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, business.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ businessId: business.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            business: {
                id: business.id,
                email: business.email,
                name: business.name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
