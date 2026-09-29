// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { register } from '../instrumentation';

const log = vi.hoisted(() => ({ warn: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/logger', () => ({ createLogger: () => log }));

const VALID = {
  NEXT_RUNTIME: 'nodejs',
  NEXT_PHASE: '',
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://khzios@db:5432/khzios',
  APP_URL: 'https://khzios.up.poznan.pl',
  ADMIN_PATH: 'zaplecze-k7f2',
};
const env = (overrides: Record<string, string> = {}) =>
  Object.entries({ ...VALID, ...overrides }).forEach(([k, v]) =>
    vi.stubEnv(k, v)
  );

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe('startup configuration check', () => {
  it('accepts a complete configuration silently', async () => {
    env();
    await expect(register()).resolves.toBeUndefined();
    expect(log.warn).not.toHaveBeenCalled();
    expect(log.error).not.toHaveBeenCalled();
  });

  it('refuses to start production without a database', async () => {
    env({ DATABASE_URL: '' });
    await expect(register()).rejects.toThrow(
      'Invalid configuration: DATABASE_URL is not set'
    );
  });

  it('only warns about a missing panel address', async () => {
    env({ ADMIN_PATH: '' });
    await register();
    expect(log.warn).toHaveBeenCalledWith(
      'ADMIN_PATH is not set — the admin panel is disabled'
    );
  });

  it('logs configuration errors in development instead of stopping', async () => {
    env({ NODE_ENV: 'development', DATABASE_URL: '' });
    await register();
    expect(log.error).toHaveBeenCalledWith('DATABASE_URL is not set');
  });

  it('skips the check during the build and outside the Node runtime', async () => {
    env({ DATABASE_URL: '', NEXT_PHASE: 'phase-production-build' });
    await expect(register()).resolves.toBeUndefined();
    env({ DATABASE_URL: '', NEXT_RUNTIME: 'edge' });
    await expect(register()).resolves.toBeUndefined();
    expect(log.error).not.toHaveBeenCalled();
  });
});
