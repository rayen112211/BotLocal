import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Groq Llama 3
// We will instantiate this inside the function to ensure env vars are loaded
const getLlm = () => new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-70b-versatile",
    temperature: 0.2
});

const getSystemPrompt = () => PromptTemplate.fromTemplate(`
You are a helpful customer service AI assistant for a local business named "{businessName}".
Your only source of knowledge is the context provided below.
If a customer asks a question outside of this context, gently reply: "Please contact us directly."
Keep your replies short and natural, like a real person texting on WhatsApp.
IMPORTANT: You must automatically detect the language the customer is writing in, and ALWAYS reply in that exact same language!

Knowledge Base Context:
{context}

Previous Conversation:
{history}

Customer: {question}
AI Assistant:`);

export const generateReply = async (businessId: string, customerPhone: string, customerMessage: string) => {
    // 1. Fetch Business Info
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return "Business not found.";

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

    // 4. Generate Response
    const llm = getLlm();
    const prompt = getSystemPrompt();

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    // 5. Booking Detection Logic
    // A parallel lightweight check via LLM or simple regex to determine if it's a booking intent
    // This can be expanded later.

    const response = await chain.invoke({
        businessName: business.name,
        context: context || "No website context available currently.",
        history: historyStr,
        question: customerMessage
    });

    return response;
};
