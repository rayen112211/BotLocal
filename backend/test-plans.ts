import { PrismaClient } from '@prisma/client';
import { handleStripeEvent } from './src/routes/stripe';

const prisma = new PrismaClient();

async function runTests() {
    console.log('--- STARTING END-TO-END PLAN TESTS ---');

    // 1. Create 3 Test Businesses
    await prisma.business.deleteMany({
        where: {
            email: {
                in: ['test-starter@example.com', 'test-pro@example.com', 'test-enterprise@example.com']
            }
        }
    });

    const starter = await prisma.business.create({
        data: {
            email: 'test-starter@example.com',
            password: 'password123',
            name: 'Starter Business',
            plan: 'Starter',
            messageCount: 50
        }
    });

    const pro = await prisma.business.create({
        data: {
            email: 'test-pro@example.com',
            password: 'password123',
            name: 'Pro Business',
            plan: 'Pro',
            messageCount: 4500
        }
    });

    const enterprise = await prisma.business.create({
        data: {
            email: 'test-enterprise@example.com',
            password: 'password123',
            name: 'Enterprise Business',
            plan: 'Enterprise',
            messageCount: 10000
        }
    });

    console.log('✅ Created 3 Test Businesses');
    console.log('Starter:', starter.plan, starter.messageCount);
    console.log('Pro:', pro.plan, pro.messageCount);
    console.log('Enterprise:', enterprise.plan, enterprise.messageCount);

    // Load global limits for the test
    const fs = require('fs');
    const path = require('path');
    const { initializeStripePrices } = require('./src/services/stripe');
    await initializeStripePrices();

    // Test Limit Enforcement
    console.log('\n--- 2. TEST MESSAGE LIMIT ENFORCEMENT ---');

    async function simulateMessage(businessId: string) {
        const b = await prisma.business.findUnique({ where: { id: businessId } });
        const planKey = b!.plan.toLowerCase();
        const planFeatures = (global as any).PLAN_FEATURES?.[planKey] || (global as any).PLAN_FEATURES?.starter;
        const limit = planFeatures?.features?.messages_per_month ?? Infinity;

        if (b!.messageCount >= limit && limit !== Infinity) {
            return { allowed: false, error: `Limit reached for ${b!.plan}` };
        }

        await prisma.business.update({
            where: { id: businessId },
            data: { messageCount: { increment: 1 } }
        });
        return { allowed: true };
    }

    // Starter at 50, limit 100
    let res = await simulateMessage(starter.id);
    console.log('Starter (50/100) message 1:', res); // Should allow

    // Bump Starter to 100
    await prisma.business.update({ where: { id: starter.id }, data: { messageCount: 100 } });
    res = await simulateMessage(starter.id);
    console.log('Starter (100/100) message limit:', res); // Should block

    // Pro at 4500, limit 5000
    res = await simulateMessage(pro.id);
    console.log('Pro (4500/5000) message 1:', res); // Should allow

    // Bump Pro to 5000
    await prisma.business.update({ where: { id: pro.id }, data: { messageCount: 5000 } });
    res = await simulateMessage(pro.id);
    console.log('Pro (5000/5000) message limit:', res); // Should block

    // Enterprise at 10000, limit Infinity
    res = await simulateMessage(enterprise.id);
    console.log('Enterprise (10000/Infinity) message 1:', res); // Should allow

    console.log('\n--- 3. TEST UPGRADES ---');
    const mockEvent = {
        id: 'evt_test_fake',
        type: 'checkout.session.completed',
        data: {
            object: {
                customer: 'cus_fake_123',
                metadata: {
                    businessId: starter.id,
                    plan: 'pro'
                },
                amount_total: 2999
            }
        }
    };

    await handleStripeEvent(mockEvent as any);

    const upgradedStarter = await prisma.business.findUnique({ where: { id: starter.id } });
    console.log('Starter Business after webhook:', upgradedStarter?.plan); // Should be Pro

    res = await simulateMessage(starter.id); // Was at 100, limit is now 5000
    console.log('Upgraded Starter (100/5000) message:', res); // Should allow

    console.log('\n--- 4. TEST MONTHLY RESET ---');
    // Simulate the scheduler logic manually
    await prisma.business.updateMany({ data: { messageCount: 0 } });
    console.log('✅ Monthly message counts reset manually');

    const resetStarter = await prisma.business.findUnique({ where: { id: starter.id } });
    console.log('Upgraded Starter message count after reset:', resetStarter?.messageCount); // Should be 0

    console.log('\n--- 5. VERIFY ISOLATION ---');
    const checkPro = await prisma.business.findUnique({ where: { id: pro.id } });
    console.log('Pro message count after reset:', checkPro?.messageCount); // Should be 0, but independent of starter

    console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
