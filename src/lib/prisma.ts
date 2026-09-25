import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createLogger } from '@/lib/logger';

const log = createLogger('prisma');

// A single TCP driver for every environment: production uses a local
// PostgreSQL server and the Neon development database accepts plain
// connections too, so behaviour in development matches production.
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  // `next build` imports this module while collecting page data without a
  // database; the pool connects lazily, so only a running server should warn.
  if (
    !connectionString &&
    process.env.NEXT_PHASE !== 'phase-production-build'
  ) {
    log.error('DATABASE_URL is not set — database queries will fail');
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof createPrismaClient>;
}

// Reuse one client across hot reloads in development to avoid exhausting
// database connections.
export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
