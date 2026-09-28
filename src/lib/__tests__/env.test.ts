import { describe, it, expect, afterEach, vi } from 'vitest';
import { checkEnv, getAdminPath, getAppUrl } from '../env';

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
        ADMIN_PATH: 'zaplecze-k7f2',
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
    const report = checkEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'x',
      ADMIN_PATH: 'zaplecze-k7f2',
    });
    expect(report.errors).toEqual([]);
    expect(report.warnings).toHaveLength(1);
    expect(
      checkEnv({ NODE_ENV: 'development', DATABASE_URL: 'x' }).warnings
    ).toEqual([]);
  });
});

describe('getAdminPath', () => {
  it('uses a valid ADMIN_PATH', () => {
    expect(
      getAdminPath({ NODE_ENV: 'production', ADMIN_PATH: 'zaplecze-k7f2' })
    ).toBe('zaplecze-k7f2');
  });

  it('disables the panel for short, reserved or malformed values without failing', () => {
    for (const value of [
      'short',
      'admin-panel',
      'Zaplecze-K7F2',
      'a/b-cdefgh',
    ]) {
      expect(getAdminPath({ NODE_ENV: 'production', ADMIN_PATH: value })).toBe(
        null
      );
      const report = checkEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'x',
        APP_URL: 'https://a.pl',
        ADMIN_PATH: value,
      });
      // Only a warning: a bad panel address must not take the site down
      expect(report.errors).toEqual([]);
      expect(report.warnings).toHaveLength(1);
      expect(report.warnings[0]).toMatch(/admin panel is disabled/);
      // The unlisted address is never written to the logs
      expect(report.warnings[0]).not.toContain(value);
    }
  });

  it('ignores slashes around the value', () => {
    expect(
      getAdminPath({ NODE_ENV: 'production', ADMIN_PATH: '/zaplecze-k7f2/' })
    ).toBe('zaplecze-k7f2');
  });

  it('defaults to /admin in development and disables the panel in production', () => {
    expect(getAdminPath({ NODE_ENV: 'development' })).toBe('admin');
    expect(getAdminPath({ NODE_ENV: 'production' })).toBe(null);
    expect(
      checkEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'x',
        APP_URL: 'https://a.pl',
      }).warnings
    ).toEqual(['ADMIN_PATH is not set — the admin panel is disabled']);
  });
});
