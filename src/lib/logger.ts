/**
 * pino logger: JSON lines in production (stdout, or LOG_FILE_PATH when set),
 * pino-pretty in development, silent in tests.
 *
 * ```ts
 * import { createLogger } from '@/lib/logger';
 * const log = createLogger('search');
 *
 * log.info({ query, page }, 'Search executed');
 * log.error({ err }, 'Search failed');
 * ```
 */

import pino from 'pino';

function buildLogger(): pino.Logger {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    return pino({ level: 'silent' });
  }

  const redact = [
    'password',
    'secret',
    'token',
    'apiKey',
    'authorization',
    'DATABASE_URL',
    '*.password',
    '*.secret',
    '*.token',
    '*.apiKey',
    '*.authorization',
    '*.DATABASE_URL',
  ];

  /* v8 ignore else -- the development logger below */
  if (isProduction) {
    const destination = process.env.LOG_FILE_PATH
      ? pino.destination(process.env.LOG_FILE_PATH)
      : process.stdout;

    return pino(
      {
        level: process.env.LOG_LEVEL || 'info',
        redact,
        formatters: {
          level(label) {
            return { level: label };
          },
        },
      },
      destination
    );
  }

  // Development only (`pnpm dev`): pino-pretty runs in a worker thread,
  // which unit tests would leave running
  /* v8 ignore start */
  return pino({
    level: 'debug',
    redact,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  });
  /* v8 ignore stop */
}

const rootLogger = buildLogger();

/**
 * Creates a child logger scoped to a module.
 *
 * @param module - Logical name, e.g. `'search'`, `'prisma'`, `'security'`.
 */
export function createLogger(module: string) {
  return rootLogger.child({ module });
}

export default rootLogger;
