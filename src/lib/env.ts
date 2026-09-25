/**
 * Runtime configuration.
 *
 * These values are read from `process.env` on every call instead of being
 * inlined at build time (unlike `NEXT_PUBLIC_*`), so one Docker image can be
 * configured per deployment through its environment.
 */

const DEFAULT_APP_URL = 'https://khzios.up.poznan.pl';

/** Public base URL of the site, without a trailing slash. */
export function getAppUrl(): string {
  return (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, '');
}

export interface EnvReport {
  errors: string[];
  warnings: string[];
}

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is not set');
  }

  if (env.APP_URL) {
    try {
      const { protocol } = new URL(env.APP_URL);
      if (protocol !== 'http:' && protocol !== 'https:') {
        errors.push(`APP_URL must use http or https, got "${protocol}"`);
      }
    } catch {
      errors.push(`APP_URL is not a valid URL: "${env.APP_URL}"`);
    }
  } else if (env.NODE_ENV === 'production') {
    warnings.push(
      `APP_URL is not set — canonical links and the sitemap will use ${DEFAULT_APP_URL}`
    );
  }

  return { errors, warnings };
}
