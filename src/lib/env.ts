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

/** Internal route of the admin panel; only reachable through ADMIN_PATH. */
export const ADMIN_INTERNAL_PATH = '/admin-panel';

const ADMIN_PATH_PATTERN = /^[a-z0-9][a-z0-9-]{7,62}$/;
// Segments the public site already uses or that are too easy to guess
const RESERVED_ADMIN_PATHS = new Set([
  'admin-panel',
  'administrator',
  'api',
  'media',
  'login',
  'wp-admin',
]);

function adminPathProblem(value: string): string | null {
  if (!ADMIN_PATH_PATTERN.test(value)) {
    return 'ADMIN_PATH must be 8–63 lowercase letters, digits or hyphens';
  }
  if (RESERVED_ADMIN_PATHS.has(value)) {
    return `ADMIN_PATH "${value}" is reserved or too easy to guess`;
  }
  return null;
}

/**
 * URL segment of the admin panel (without slashes), or null when the panel
 * is disabled. Development falls back to "admin" so the panel works out of
 * the box; production requires an explicit, non-obvious ADMIN_PATH.
 */
export function getAdminPath(env: NodeJS.ProcessEnv = process.env) {
  const value = env.ADMIN_PATH?.trim();
  if (value) return adminPathProblem(value) ? null : value;
  return env.NODE_ENV === 'production' ? null : 'admin';
}

/** Directory for files uploaded in the admin panel (served at /media). */
export function getUploadDir(env: NodeJS.ProcessEnv = process.env) {
  return env.UPLOAD_DIR || './uploads';
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

  const adminPath = env.ADMIN_PATH?.trim();
  if (adminPath) {
    const problem = adminPathProblem(adminPath);
    if (problem) errors.push(problem);
  } else if (env.NODE_ENV === 'production') {
    warnings.push('ADMIN_PATH is not set — the admin panel is disabled');
  }

  return { errors, warnings };
}
