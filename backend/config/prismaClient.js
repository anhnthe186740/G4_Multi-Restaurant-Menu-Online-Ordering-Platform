import { PrismaClient } from '@prisma/client';

// Singleton pattern — tránh tạo nhiều connection trong môi trường dev (HMR)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
