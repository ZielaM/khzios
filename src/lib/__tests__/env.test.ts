import { describe, it, expect, afterEach, vi } from 'vitest';
import { checkEnv, getAppUrl } from '../env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getAppUrl', () => {
  it('strips trailing slashes', () => {
    vi.stubEnv('APP_URL', 'https://example.org/');
    expect(getAppUrl()).toBe('https://example.org');
  });
});

describe('checkEnv', () => {
  it('accepts a complete configuration', () => {
    expect(
      checkEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://u:p@db:5432/khzios',
        APP_URL: 'https://khzios.up.poznan.pl',
      })
    ).toEqual({ errors: [], warnings: [] });
  });

  it('requires DATABASE_URL', () => {
    expect(checkEnv({ NODE_ENV: 'development' }).errors).toContain(
      'DATABASE_URL is not set'
    );
  });

  it('rejects malformed or non-http APP_URL values', () => {
    const base = { NODE_ENV: 'production', DATABASE_URL: 'x' } as const;
    expect(checkEnv({ ...base, APP_URL: 'not a url' }).errors).toHaveLength(1);
    expect(checkEnv({ ...base, APP_URL: 'ftp://host' }).errors).toHaveLength(1);
  });

  it('only warns about a missing APP_URL in production', () => {
    const report = checkEnv({ NODE_ENV: 'production', DATABASE_URL: 'x' });
    expect(report.errors).toEqual([]);
    expect(report.warnings).toHaveLength(1);
    expect(
      checkEnv({ NODE_ENV: 'development', DATABASE_URL: 'x' }).warnings
    ).toEqual([]);
  });
});
