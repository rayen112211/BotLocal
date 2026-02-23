const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function main() {
    const business = await prisma.business.findFirst({
        where: { telegramBotToken: { not: null } }
    });

    if (!business || !business.telegramBotToken) {
        console.log("No token found in database");
        return;
    }

    console.log("Found Token:", business.telegramBotToken);

    try {
        const response = await axios.get(`https://api.telegram.org/bot${business.telegramBotToken}/getWebhookInfo`);
        console.log("Webhook Info:", JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("Failed to query telegram API", e.response?.data || e.message);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
