import { DB_URL } from '@config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { logger } from '../logger';

const pool = new Pool({ connectionString: DB_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

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
