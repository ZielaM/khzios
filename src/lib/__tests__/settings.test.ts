import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getSettings, SETTING_DEFAULTS } from '../settings';

vi.mock('@/lib/prisma', () => ({
  prisma: { siteSetting: { findMany: vi.fn() } },
}));
vi.mock('react', () => ({ cache: <T>(fn: T) => fn }));

const rows = vi.mocked(prisma.siteSetting.findMany);
beforeEach(() => vi.clearAllMocks());

describe('getSettings', () => {
  it('uses the defaults on an empty database', async () => {
    rows.mockResolvedValue([]);
    expect(await getSettings()).toEqual(SETTING_DEFAULTS);
  });

  it('applies the values saved in the panel over the defaults', async () => {
    rows.mockResolvedValue([
      { key: 'contact', value: { phone: '+48 61 000 00 00' } },
      { key: 'accessibility', value: { published: '2026-10-01' } },
    ] as never);
    const settings = await getSettings();
    expect(settings.contact).toEqual({
      email: SETTING_DEFAULTS.contact.email,
      phone: '+48 61 000 00 00',
    });
    expect(settings.accessibility.published).toBe('2026-10-01');
    // The defaults themselves stay untouched for the next request
    expect(SETTING_DEFAULTS.contact.phone).toBe('+48 61 848 72 45');
  });

  it('ignores unknown keys, unknown fields and non-text values', async () => {
    rows.mockResolvedValue([
      { key: 'removed', value: { x: 'y' } },
      { key: 'privacy', value: null },
      { key: 'contact', value: 'not an object' },
      { key: 'contact', value: { email: 42, fax: '123' } },
    ] as never);
    expect(await getSettings()).toEqual(SETTING_DEFAULTS);
  });

  it('still renders pages when the database is unavailable', async () => {
    rows.mockRejectedValue(new Error('connection refused'));
    expect(await getSettings()).toEqual(SETTING_DEFAULTS);
  });
});
