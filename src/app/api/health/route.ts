import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('health');

export const dynamic = 'force-dynamic';

/** Liveness and database check for the Docker HEALTHCHECK. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok' });
  } catch (err) {
    log.error({ err }, 'Health check failed');
    return Response.json({ status: 'error' }, { status: 503 });
  }
}
