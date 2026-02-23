import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient instance across the backend
const prisma = new PrismaClient();

export default prisma;

