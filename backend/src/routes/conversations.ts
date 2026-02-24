import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// List all conversations for a business
router.get('/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        // Verify token ownership
        if ((req as any).businessId !== businessId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const conversations = await prisma.conversation.findMany({
            where: { businessId },
            orderBy: { updatedAt: 'desc' }
        });

        const formatted = conversations.map(c => {
            let lastMsg = "No messages";
            try {
                const msgs = JSON.parse(c.messages);
                if (msgs.length > 0) lastMsg = msgs[msgs.length - 1].content;
            } catch (e) { }

            return {
                id: c.id,
                customerPhone: c.customerPhone,
                lastMessage: lastMsg,
                updatedAt: c.updatedAt,
                isAiEnabled: c.isAiEnabled
            };
        });

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get full history for a specific conversation
router.get('/:businessId/:customerPhone', async (req, res) => {
    try {
        const { businessId, customerPhone } = req.params;

        // Verify token ownership
        if ((req as any).businessId !== businessId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const conversation = await prisma.conversation.findFirst({
            where: { businessId, customerPhone: customerPhone.replace('whatsapp:', '') }
        });

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        res.json({
            ...conversation,
            messages: JSON.parse(conversation.messages)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Toggle AI behavior for a conversation
router.patch('/toggle-ai', async (req, res) => {
    try {
        const { conversationId, isAiEnabled } = req.body;

        // Verify ownership
        const existing = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!existing || existing.businessId !== (req as any).businessId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: { isAiEnabled }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle AI' });
    }
});

export default router;
