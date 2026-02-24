import schedule from 'node-schedule';
import prisma from '../lib/prisma';

export function initScheduler() {
    // Run every 1st of month at 00:00 UTC
    schedule.scheduleJob('0 0 1 * *', async () => {
        try {
            await prisma.business.updateMany({
                data: { messageCount: 0 }
            });
            console.log('✅ Monthly message counts reset');
        } catch (error) {
            console.error('❌ Failed to reset monthly message counts:', error);
        }
    });
}
