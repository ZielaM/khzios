import { PrismaClient } from '@/generated/prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import ws from 'ws';
import { createLogger } from '@/lib/logger';

const log = createLogger('prisma');

neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.DATABASE_URL}`;

const prismaClientSingleton = () => {
  if (!connectionString || connectionString === 'undefined') {
    log.error('DATABASE_URL is not set — Prisma client cannot connect');
  }

  const isNeon = connectionString.includes('neon.tech');
  log.info({ adapter: isNeon ? 'neon' : 'pg' }, 'Initialising Prisma client');

  if (!isNeon) {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
