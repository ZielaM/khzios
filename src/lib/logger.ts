/**
 * Application logger built on pino.
 *
 * Production:
 *   Structured JSON → stdout → captured by Docker logging driver / K8s / Vercel.
 *   Configure downstream routing via Docker `--log-driver`, Loki, Datadog, etc.
 *
 * Development:
 *   Colorised, human-readable output via pino-pretty.
 *
 * Test:
 *   Silent — zero noise in CI output.
 *
 * Usage:
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

  if (isProduction) {
    // If LOG_FILE_PATH is provided (e.g. '/var/log/khzios/app.log'), write to it.
    // Otherwise, write to process.stdout (standard for Docker, Vercel, PM2).
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
        // Routing to files / log aggregators is handled by infrastructure:
        //   Docker:     --log-driver json-file | fluentd | awslogs
        //   Vercel:     captured automatically
        //   PM2:        pm2 logs / pm2-logrotate
      },
      destination
    );
  }

  // Development — pretty printing
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
