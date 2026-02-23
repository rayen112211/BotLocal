import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { scannerScanSchema } from '../validation';

const router = Router();

// GET all knowledge base entries
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        if (!businessId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const entries = await prisma.knowledgeBase.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            success: true,
            entries: entries.map(e => ({
                id: e.id,
                url: e.url,
                pagesScanned: e.pagesScanned || 1,
                contentLength: e.content.length,
                createdAt: e.createdAt.toISOString(),
                updatedAt: e.updatedAt.toISOString(),
            })),
            totalEntries: entries.length
        });
    } catch (error) {
        console.error('Get knowledge base error:', error);
        res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
});

// GET single knowledge base entry content
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;

        const entry = await prisma.knowledgeBase.findUnique({
            where: { id }
        });

        if (!entry || entry.businessId !== businessId) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }

        res.json({
            success: true,
            entry: {
                id: entry.id,
                url: entry.url,
                content: entry.content,
                contentLength: entry.content.length,
                createdAt: entry.createdAt.toISOString(),
                updatedAt: entry.updatedAt.toISOString(),
            }
        });
    } catch (error) {
        console.error('Get entry error:', error);
        res.status(500).json({ error: 'Failed to fetch entry' });
    }
});

// POST scan and ingest website
router.post('/scan', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const parsed = scannerScanSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid URL', details: parsed.error.flatten() });
        }
        const { url } = parsed.data;

        // Check if already scanned
        const existing = await prisma.knowledgeBase.findFirst({
            where: { businessId, url }
        });

        if (existing) {
            return res.status(400).json({
                error: 'This URL has already been scanned',
                entryId: existing.id
            });
        }

        console.log(`[SCANNER] Starting multi-page scan for URL: ${url}`);

        const visited = new Set<string>();
        const toVisit = [url];
        let totalContent = "";
        const maxPages = 5;

        // Recursive crawl logic
        while (toVisit.length > 0 && visited.size < maxPages) {
            const currentUrl = toVisit.shift()!;
            if (visited.has(currentUrl)) continue;

            try {
                console.log(`[SCANNER] Crawling (${visited.size + 1}/${maxPages}): ${currentUrl}`);
                const { data } = await axios.get(currentUrl, {
                    timeout: 8000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });

                const $ = cheerio.load(data);

                // 1. Extract and Clean Content
                const pageTitle = $('title').text().trim();
                $('script, style, noscript, iframe, img, svg, meta, link, button, footer, nav').remove();
                const pageText = $('body').text().replace(/\s+/g, ' ').trim();

                if (pageText.length > 200) {
                    totalContent += `\n\n--- Page: ${pageTitle} (${currentUrl}) ---\n${pageText}`;
                }

                visited.add(currentUrl);

                // 2. Discover Links (Same domain only)
                const baseUrl = new URL(url);
                $('a[href]').each((_, el) => {
                    try {
                        let href = $(el).attr('href');
                        if (!href) return;

                        const absoluteUrl = new URL(href, currentUrl);
                        if (absoluteUrl.hostname === baseUrl.hostname && !visited.has(absoluteUrl.toString())) {
                            // Avoid non-html or media
                            if (!absoluteUrl.pathname.match(/\.(jpg|png|pdf|zip|css|js)$/i)) {
                                toVisit.push(absoluteUrl.toString());
                            }
                        }
                    } catch (e) { }
                });
            } catch (err: any) {
                console.warn(`[SCANNER] Failed to crawl ${currentUrl}: ${err.message}`);
                visited.add(currentUrl); // Mark as tried
            }
        }

        const finalContent = totalContent.trim().slice(0, 100000); // 100k cap

        if (!finalContent || finalContent.length < 50) {
            return res.status(400).json({
                error: 'No meaningful content found on this website. Make sure the URL is correct.'
            });
        }

        console.log(`[SCANNER] Multi-page scan complete. Total pages: ${visited.size}, Total content: ${finalContent.length} chars`);

        // Save to database
        const kb = await prisma.knowledgeBase.create({
            data: {
                businessId: businessId!,
                url, // Main entry URL
                content: finalContent,
                pagesScanned: visited.size
            }
        });

        res.status(201).json({
            success: true,
            entry: {
                id: kb.id,
                url: kb.url,
                pagesScanned: visited.size,
                contentLength: kb.content.length,
                message: `Website scanned successfully! We've analyzed ${visited.size} pages to build your bot's brain.`
            }
        });
    } catch (error: any) {
        console.error('[SCANNER] Error:', error.message);

        if (error.code === 'ENOTFOUND') {
            return res.status(400).json({ error: 'Website not found. Check the URL.' });
        }
        if (error.code === 'ECONNREFUSED') {
            return res.status(400).json({ error: 'Could not connect to website.' });
        }
        if (error.code === 'ECONNABORTED') {
            return res.status(400).json({ error: 'Website took too long to respond.' });
        }

        res.status(500).json({ error: 'Failed to scan website' });
    }
});

// DELETE knowledge base entry
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;

        const entry = await prisma.knowledgeBase.findUnique({
            where: { id }
        });

        if (!entry || entry.businessId !== businessId) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }

        await prisma.knowledgeBase.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Knowledge base entry deleted successfully'
        });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// PUT update knowledge base entry (manual content update)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const entry = await prisma.knowledgeBase.findUnique({
            where: { id }
        });

        if (!entry || entry.businessId !== businessId) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }

        const updated = await prisma.knowledgeBase.update({
            where: { id },
            data: { content: content.slice(0, 50000) } // Limit size
        });

        res.json({
            success: true,
            entry: {
                id: updated.id,
                url: updated.url,
                contentLength: updated.content.length,
                message: 'Knowledge base updated successfully'
            }
        });
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// POST rescan a knowledge base entry
router.post('/:id/rescan', authenticate, async (req: AuthRequest, res) => {
    try {
        const { businessId } = req;
        const id = req.params.id as string;

        const entry = await prisma.knowledgeBase.findUnique({
            where: { id }
        });

        if (!entry || entry.businessId !== businessId) {
            return res.status(404).json({ error: 'Knowledge base entry not found' });
        }

        // Fetch and parse again
        const { data } = await axios.get(entry.url!, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(data);
        $('script, style, noscript, iframe, img, svg, meta, link, button').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 50000);

        if (!textContent || textContent.length < 50) {
            return res.status(400).json({ error: 'No content found after rescan' });
        }

        const updated = await prisma.knowledgeBase.update({
            where: { id },
            data: { content: textContent }
        });

        res.json({
            success: true,
            entry: {
                id: updated.id,
                contentLength: updated.content.length,
                message: 'Knowledge base rescanned and updated'
            }
        });
    } catch (error: any) {
        console.error('Rescan error:', error.message);
        res.status(500).json({ error: 'Failed to rescan website' });
    }
});

export default router;
