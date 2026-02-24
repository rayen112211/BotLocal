import axios from 'axios';
import prisma from '../lib/prisma';

const INDUSTRY_PROMPTS: Record<string, string> = {
    "Restaurant": "Focus on menu availability, reservation times, dietary options, and restaurant ambiance. Encourage users to book a table for dining.",
    "Retail": "Focus on product availability, store locations, return policies, and current promotions. Help customers find what they are looking for in your inventory.",
    "Medical": "Focus on appointment scheduling, clinic hours, and accepted insurance. IMPORTANT: Do not provide any medical advice. Always refer health concerns to the professional staff.",
    "Home Services": "Focus on service quotes, emergency availability, service areas, and technician scheduling. Emphasize reliability and professional expertise.",
    "General": "Provide helpful, general assistance based on the business information provided. Be professional and efficient."
};

const getSystemPrompt = (businessName: string, industry: string, personality: string, customInstructions: string, context: string, history: string) => {
    const industrySnippet = INDUSTRY_PROMPTS[industry] || INDUSTRY_PROMPTS["General"];

    return `
You are a helpful customer service AI assistant for a local business named "${businessName}". 
This business operates in the ${industry} industry.

Your Industry Focus:
${industrySnippet}

Your Personality:
${personality}

Custom Business Rules/Instructions:
${customInstructions}

Your only source of knowledge is the context provided below.
If a customer asks a question outside of this context, gently reply: "Please contact us directly."
Keep your replies short and natural, like a real person texting on WhatsApp.
IMPORTANT: You must automatically detect the language the customer is writing in, and ALWAYS reply in that exact same language!

Knowledge Base Context:
${context}

Previous Conversation:
${history}
`;
};

export const generateReply = async (businessId: string, customerPhone: string, customerMessage: string) => {
    // 1. Fetch Business Info
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return "Business not found.";

    const planKey = business.plan.toLowerCase();
    const planFeatures = global.PLAN_FEATURES?.[planKey] || global.PLAN_FEATURES?.starter;
    const messageLimit = planFeatures?.features?.messages_per_month;

    if (messageLimit !== null && business.messageCount >= messageLimit) {
        return "Please contact the business directly. (Message limit reached)";
    }

    // 2. Fetch Knowledge Base
    const kbs = await prisma.knowledgeBase.findMany({ where: { businessId } });
    const context = kbs.map(k => k.content).join("\n\n");

    // 3. Fetch Conversation History (last 5 messages)
    const conv = await prisma.conversation.findFirst({
        where: { businessId, customerPhone },
        orderBy: { updatedAt: 'desc' }
    });

    let historyStr = "";
    if (conv && conv.messages) {
        try {
            const msgs = JSON.parse(conv.messages);
            historyStr = msgs.slice(-5).map((m: any) => `${m.role === 'user' ? 'Customer' : 'AI Assistant'}: ${m.content}`).join("\n");
        } catch (e) { }
    }



    // 5. Booking Detection Logic
    let bookingAddedMessage = "";

    try {
        const extractionPromptText = `
Analyze the following conversation and extract booking details.
Return ONLY valid JSON in this exact format:
{
  "isBookingIntent": true/false (True if they actively want to book an appointment right now),
  "customerName": "name or null",
  "date": "specific requested date or null",
  "time": "specific requested time or null",
  "serviceType": "service requested or null"
}

Previous Conversation:
${historyStr}

Customer: ${customerMessage}
        `;

        const extractionResponse = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: extractionPromptText }],
            response_format: { type: "json_object" }
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const rawJsonString = extractionResponse.data.choices[0].message.content;
        const extracted = JSON.parse(rawJsonString);

        if (extracted.isBookingIntent && extracted.date && extracted.time) {
            let bookingDate = new Date();

            await prisma.booking.create({
                data: {
                    businessId: business.id,
                    customerPhone: customerPhone,
                    customerName: extracted.customerName || "Customer",
                    date: bookingDate,
                    time: extracted.time,
                    serviceType: extracted.serviceType || "General Service",
                    status: "pending",
                    notes: "Auto-booked via AI WhatsApp Agent."
                }
            });

            console.log(`[BOOKING ENGINE] Created pending booking for ${customerPhone} at ${extracted.date} ${extracted.time}`);
            bookingAddedMessage = `\n\nSYSTEM NOTIFICATION: You have successfully created a booking for ${extracted.date} at ${extracted.time}. Inform the customer that their booking request is Pending Confirmation by the staff!`;
        } else if (extracted.isBookingIntent) {
            bookingAddedMessage = `\n\nSYSTEM NOTIFICATION: The customer wants to book, but is missing date or time. Politely ask them for what date and time they would prefer.`;
        }
    } catch (e: any) {
        console.error("[BOOKING ENGINE ERROR] Failed to parse booking intent via OpenRouter HTTP fetch:", e.message);
    }

    // Finally, generate the actual ChatBot Response using Axios
    try {
        const fullContext = context + bookingAddedMessage;
        const systemPromptText = getSystemPrompt(
            business.name,
            business.industry || "General",
            business.botPersonality,
            business.customInstructions || "",
            fullContext,
            historyStr
        );

        console.log(`[AI SERVICE] Sending primary chat request to Groq for ${customerPhone}...`);

        const chatResponse = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            messages: [
                { role: "system", content: systemPromptText },
                { role: "user", content: customerMessage }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`[AI SERVICE] Successfully received Chat response from Groq.`);
        return chatResponse.data.choices[0].message.content;

    } catch (error: any) {
        console.error(`[AI SERVICE ERROR] Failed to generate chat reply via Groq:`, error?.response?.data || error.message);
        return "I am currently experiencing technical difficulties connecting to my brain. Please contact the business directly via phone!";
    }
};
