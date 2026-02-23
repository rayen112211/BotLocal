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

        console.log(`[SCANNER] Requesting Jina Reader for URL: ${url}`);

        let finalContent = "";
        try {
            const jinaUrl = `https://r.jina.ai/${url}`;
            const response = await fetch(jinaUrl, {
                headers: {
                    'Accept': 'text/plain',
                    'User-Agent': 'BotLocal/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Jina API returned ${response.status}`);
            }

            const rawContent = await response.text();
            // Jina returns markdown, let's limit it to 100k chars
            finalContent = rawContent.trim().slice(0, 100000);

            if (!finalContent || finalContent.length < 50) {
                return res.status(400).json({
                    error: 'Could not extract meaningful content from this website. Please paste your business info manually.'
                });
            }
        } catch (err: any) {
            console.error(`[SCANNER] Jina Reader failed: ${err.message}`);
            return res.status(400).json({
                error: 'Failed to scan website. It might be heavily protected or unavailable. Please paste your business info manually.'
            });
        }

        console.log(`[SCANNER] Jina scan complete. Total content: ${finalContent.length} chars`);

        // Save to database
        const kb = await prisma.knowledgeBase.create({
            data: {
                businessId: businessId!,
                url, // Main entry URL
                content: finalContent,
                pagesScanned: 1
            }
        });

        res.status(201).json({
            success: true,
            entry: {
                id: kb.id,
                url: kb.url,
                pagesScanned: 1, // Jina summarizes the page structure automatically
                contentLength: kb.content.length,
                message: `Website scanned successfully! We've extracted your business information.`
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

        // Fetch from Jina AI
        const jinaUrl = `https://r.jina.ai/${entry.url}`;
        const response = await fetch(jinaUrl, {
            headers: {
                'Accept': 'text/plain',
                'User-Agent': 'BotLocal/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Jina API returned ${response.status}`);
        }

        const rawContent = await response.text();
        const textContent = rawContent.trim().slice(0, 50000);

        if (!textContent || textContent.length < 50) {
            return res.status(400).json({ error: 'No meaningful content found after rescan.' });
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
