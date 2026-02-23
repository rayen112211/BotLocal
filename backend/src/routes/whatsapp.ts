import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateReply } from '../services/ai';
import twilio from 'twilio';

const router = Router();
const prisma = new PrismaClient();

router.post('/webhook', async (req, res) => {
    const { Body, From, To } = req.body;

    // 1. Immediate Validation & Response
    if (!Body || !From || !To) {
        return res.status(200).send('Missing parameters'); // Still send 200 to Twilio to stop retries
    }

    const customerPhone = From.replace('whatsapp:', '');
    const twilioPhone = To.replace('whatsapp:', '');

    // Identify Business strictly by Twilio phone number
    const business = await prisma.business.findFirst({
        where: { twilioPhone: twilioPhone }
    });

    if (!business) {
        console.log(`[WEBHOOK] No business found for number: ${twilioPhone}. Ignoring message.`);
        return res.status(200).send('OK'); // Do nothing, but return 200
    }

    // Respond to Twilio immediately to meet the <5s requirement
    res.status(200).send('OK');

    // 2. Asynchronous Background processing
    (async () => {
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
            const authToken = process.env.TWILIO_AUTH_TOKEN || '';
            const client = twilio(accountSid, authToken);
            const fromNumber = business.twilioPhone || process.env.TWILIO_PHONE_NUMBER || '';
            const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

            // A. Limit Check
            if (business.plan === 'Starter' && business.messageCount >= 500) {
                await client.messages.create({
                    body: "Please contact the business directly.",
                    from: formattedFrom,
                    to: `whatsapp:${customerPhone}`
                });
                return;
            }

            // B. Get/Update Conversation
            let conv = await prisma.conversation.findFirst({
                where: { businessId: business.id, customerPhone }
            });

            let msgs = [];
            if (conv && conv.messages) {
                try {
                    msgs = JSON.parse(conv.messages);
                } catch (e) {
                    msgs = [];
                }
            }
            msgs.push({ role: 'user', content: Body });

            // C. AI Processing
            let aiResponse = "";
            if (conv && !conv.isAiEnabled) {
                console.log('[WEBHOOK] AI Disabled for:', customerPhone);
            } else {
                aiResponse = await generateReply(business.id, customerPhone, Body);
                if (aiResponse) {
                    msgs.push({ role: 'assistant', content: aiResponse });
                }
            }

            // D. Database Sync
            if (conv) {
                await prisma.conversation.update({
                    where: { id: conv.id },
                    data: {
                        messages: JSON.stringify(msgs),
                        updatedAt: new Date()
                    }
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

            // E. Dispatch
            if (aiResponse) {
                await client.messages.create({
                    body: aiResponse,
                    from: formattedFrom,
                    to: `whatsapp:${customerPhone}`
                });

                await prisma.business.update({
                    where: { id: business.id },
                    data: { messageCount: { increment: 1 } }
                });
            }

        } catch (error: any) {
            console.error('[WEBHOOK ASYNC ERROR]:', error.message);

            // AI Crash Fallback (Mandatory)
            try {
                const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
                const authToken = process.env.TWILIO_AUTH_TOKEN || '';
                const client = twilio(accountSid, authToken);
                const fromNumber = business.twilioPhone || process.env.TWILIO_PHONE_NUMBER || '';
                const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

                await client.messages.create({
                    body: "Thank you for your message! We are currently unavailable, please contact us directly.",
                    from: formattedFrom,
                    to: `whatsapp:${customerPhone}`
                });
            } catch (fallbackError: any) {
                console.error('[FATAL FALLBACK ERROR]:', fallbackError.message);
            }
        }
    })();
});

export default router;
