import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateReply } from '../services/ai';
import twilio from 'twilio';

const router = Router();
const prisma = new PrismaClient();

router.post('/webhook', async (req, res) => {
    try {
        const { Body, From, To } = req.body;
        // Twilio sends From as "whatsapp:+1234567890" and To as "whatsapp:+0987654321"

        if (!Body || !From || !To) {
            return res.status(400).send('Missing Twilio parameters');
        }

        const customerPhone = From.replace('whatsapp:', '');
        const twilioPhone = To.replace('whatsapp:', '');

        // 1. Identify Business by Twilio phone number
        // We will assume "To" is the business's mapped number
        let business = await prisma.business.findFirst({
            where: { twilioPhone }
        });

        if (!business) {
            // Fallback for development if no numbers mapped, using first business created
            business = await prisma.business.findFirst();
            if (!business) return res.status(404).send('Business not found');
        }

        // 2. Limit Check
        if (business.plan === 'Starter' && business.messageCount >= 500) {
            // Send limit message
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({
                body: "Please contact the business directly.",
                from: `whatsapp:${business.twilioPhone}`,
                to: `whatsapp:${customerPhone}`
            });
            return res.status(200).send('Limit reached');
        }

        // 3. Generate AI Reply
        const aiResponse = await generateReply(business.id, customerPhone, Body);

        // 4. Update Conversation History
        let conv = await prisma.conversation.findFirst({
            where: { businessId: business.id, customerPhone }
        });

        let msgs = [];
        if (conv && conv.messages) {
            msgs = JSON.parse(conv.messages);
        }

        msgs.push({ role: 'user', content: Body });
        msgs.push({ role: 'assistant', content: aiResponse });

        if (conv) {
            await prisma.conversation.update({
                where: { id: conv.id },
                data: { messages: JSON.stringify(msgs) }
            });
        } else {
            await prisma.conversation.create({
                data: {
                    businessId: business.id,
                    customerPhone,
                    messages: JSON.stringify(msgs)
                }
            });
        }

        // 5. Send WhatsApp Message
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: aiResponse,
            from: `whatsapp:${business.twilioPhone || process.env.TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${customerPhone}`
        });

        // Increment Usage
        await prisma.business.update({
            where: { id: business.id },
            data: { messageCount: { increment: 1 } }
        });

        res.status(200).send('Success');
    } catch (error: any) {
        console.error('WhatsApp Webhook Error:', error.message);
        res.status(500).send('Webhook failed');
    }
});

export default router;
