import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();
const prisma = new PrismaClient();

router.post('/scan', async (req, res) => {
    try {
        const { url, businessId } = req.body;
        if (!url || !businessId) {
            return res.status(400).json({ error: 'URL and businessId required' });
        }

        // 1. Fetch website content
        console.log(`Scanning URL: ${url}`);
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Remove scripts, styles, etc.
        $('script, style, noscript, iframe, img, svg').remove();

        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        console.log(`Extracted ${textContent.length} characters of text.`);

        // 2. Chuncking and Embedding (using HuggingFace - placeholder for now)
        // We will generate the embedding using HuggingFace in another service

        // Save to Database
        const kb = await prisma.knowledgeBase.create({
            data: {
                businessId,
                url,
                content: textContent,
                // embedding will be saved later or here if we await it 
            }
        });

        res.json({ success: true, kbId: kb.id, message: 'Website scanned and saved successfully' });
    } catch (error: any) {
        console.error('Scan error:', error.message);
        res.status(500).json({ error: 'Failed to scan website.' });
    }
});

// Get Knowledge Base entries
router.get('/:businessId', async (req, res) => {
    try {
        const entries = await prisma.knowledgeBase.findMany({
            where: { businessId: req.params.businessId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
});

export default router;
