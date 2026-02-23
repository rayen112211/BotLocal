import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import prisma from '../lib/prisma';
import { JWT_SECRET } from '../config';
import { signupSchema, loginSchema } from '../validation';

const router = Router();

router.post('/signup', async (req, res) => {
    try {
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid signup data', details: parsed.error.flatten() });
        }
        const { email, password, name } = parsed.data;

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
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid login data', details: parsed.error.flatten() });
        }
        const { email, password } = parsed.data;

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
