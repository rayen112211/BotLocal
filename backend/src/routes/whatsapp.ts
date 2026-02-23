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
            console.error('[WEBHOOK] Missing Twilio parameters:', req.body);
            return res.status(400).send('Missing Twilio parameters');
        }

        const customerPhone = From.replace('whatsapp:', '');
        const twilioPhone = To.replace('whatsapp:', '');

        // 1. Identify Business by Twilio phone number
        // In Sandbox, "To" is often the Sandbox number. 
        // In Production, "To" will be the unique Business Twilio number.
        let business = await prisma.business.findFirst({
            where: { twilioPhone: twilioPhone }
        });

        if (!business) {
            // Fallback: If we can't find by phone, try finding by name if it's the only one 
            // (Convenient for Sandbox testing with multiple businesses)
            business = await prisma.business.findFirst();
            if (!business) {
                console.error('[WEBHOOK] FATAL: No businesses exist in the database!');
                return res.status(404).send('Business not found');
            }
            console.log(`[WEBHOOK] Using Fallback Business: ${business.name} for To: ${twilioPhone} `);
        } else {
            console.log(`[WEBHOOK] Identified Business: ${business.name} (${business.id})`);
        }

        // 2. Limit Check
        if (business.plan === 'Starter' && business.messageCount >= 500) {
            console.log('[WEBHOOK] Starter plan limit reached for:', customerPhone);
            const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
            const authToken = process.env.TWILIO_AUTH_TOKEN || '';
            const client = twilio(accountSid, authToken);
            await client.messages.create({
                body: "Please contact the business directly.",
                from: `whatsapp:${business.twilioPhone} `,
                to: `whatsapp:${customerPhone} `
            });
            return res.status(200).send('Limit reached');
        }

        // 3. Update Conversation History & Check AI Status
        let conv = await prisma.conversation.findFirst({
            where: { businessId: business.id, customerPhone }
        });

        let msgs = [];
        if (conv && conv.messages) {
            msgs = JSON.parse(conv.messages);
        }
        msgs.push({ role: 'user', content: Body });

        // Generate AI Reply if enabled
        let aiResponse = "";
        if (conv && !conv.isAiEnabled) {
            console.log('[WEBHOOK] AI is DISABLED for this conversation. Skipping reply generation.');
        } else {
            console.log('[WEBHOOK] Generating AI reply for:', customerPhone);
            aiResponse = await generateReply(business.id, customerPhone, Body);
            console.log('[WEBHOOK] AI Reply generated successfully:', aiResponse?.substring(0, 50) + "...");
            if (aiResponse) {
                msgs.push({ role: 'assistant', content: aiResponse });
            }
        }

        if (conv) {
            conv = await prisma.conversation.update({
                where: { id: conv.id },
                data: {
                    messages: JSON.stringify(msgs),
                    updatedAt: new Date()
                }
            });
        } else {
            conv = await prisma.conversation.create({
                data: {
                    businessId: business.id,
                    customerPhone,
                    messages: JSON.stringify(msgs)
                }
            });
        }

        // 4. Send WhatsApp Message (Only if AI generated a response)
        if (!aiResponse) return res.status(200).send('AI disabled or no response');

        const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
        const authToken = process.env.TWILIO_AUTH_TOKEN || '';
        const client = twilio(accountSid, authToken);

        // Always try to use the specific business's Twilio number, fallback to ENV
        const fromNumber = business.twilioPhone || process.env.TWILIO_PHONE_NUMBER || '';
        const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber} `;

        console.log('[WEBHOOK] Dispatching Twilio message from:', formattedFrom);

        const messagePayload = await client.messages.create({
            body: aiResponse,
            from: formattedFrom,
            to: `whatsapp:${customerPhone} `
        });

        console.log('[WEBHOOK] Successfully dispatched to Twilio SID:', messagePayload.sid);

        // Increment Usage
        await prisma.business.update({
            where: { id: business.id },
            data: { messageCount: { increment: 1 } }
        });

        res.status(200).send('Success');
    } catch (error: any) {
        console.error('[WEBHOOK ERROR] WhatsApp Webhook Failed:', error.message);
        if (error.response) {
            console.error('[WEBHOOK ERROR PARAMS]', error.response?.data);
        }
        res.status(500).send('Webhook failed');
    }
});

export default router;
