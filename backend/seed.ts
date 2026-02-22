import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.booking.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.knowledgeBase.deleteMany();
    await prisma.business.deleteMany();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create a mock business
    const business = await prisma.business.create({
        data: {
            id: 'PLACEHOLDER_ID',
            email: 'admin@botlocal.com',
            password: hashedPassword,
            name: 'La Petite Restaurant',
            phone: '+1234567890',
            plan: 'Starter',
            messageCount: 124
        }
    });

    console.log("Mock Business created:", business.id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
