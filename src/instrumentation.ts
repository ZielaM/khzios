/**
 * Runs once when the Next.js server starts. A misconfigured deployment should
 * fail at startup rather than on the first request that touches the database.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // `next build` also loads instrumentation, but the image is built without
  // runtime configuration, so validation only applies to a running server.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const { checkEnv } = await import('@/lib/env');
  const { createLogger } = await import('@/lib/logger');
  const log = createLogger('env');
  const { errors, warnings } = checkEnv();

  warnings.forEach((w) => log.warn(w));
  if (errors.length === 0) return;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Invalid configuration: ${errors.join('; ')}`);
  }
  errors.forEach((e) => log.error(e));
}
