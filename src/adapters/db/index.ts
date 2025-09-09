import { PrismaClient } from '@prisma/client';

import { logger } from '../logger';

export const prisma = new PrismaClient();

export const connectDb = async () => {
  try {
    await prisma.$connect();
    logger.info('🔥 Prisma - Connection to db has been established successfully.');
    return prisma;
  } catch (err) {
    logger.error(err, 'Connection to db failed');
    throw err;
  }
};
