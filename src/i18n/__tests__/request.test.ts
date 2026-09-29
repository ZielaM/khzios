// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { notFound } from 'next/navigation';
import { withContentOverrides } from '@/lib/content-overrides';
import getRequestConfig from '../request';
import { setPageLocale } from '../page-locale';

vi.mock('next-intl', async (importOriginal) => importOriginal());
vi.mock('next-intl/server', () => ({
  // The config function itself, so the test can call it
  getRequestConfig: <T>(fn: T) => fn,
  setRequestLocale: vi.fn(),
}));
vi.mock('../routing', async (importOriginal) => importOriginal());
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('@/lib/content-overrides', () => ({
  withContentOverrides: vi.fn(async (messages: object, locale: string) => ({
    ...messages,
    overriddenFor: locale,
  })),
}));

type Config = (params: {
  requestLocale: Promise<string | undefined>;
}) => Promise<{ locale: string; messages: Record<string, unknown> }>;
const config = getRequestConfig as unknown as Config;

describe('request configuration', () => {
  it('loads the requested language with the texts edited in the panel', async () => {
    const { locale, messages } = await config({
      requestLocale: Promise.resolve('uk'),
    });
    expect(locale).toBe('uk');
    expect(messages.overriddenFor).toBe('uk');
    expect(messages).toHaveProperty('Navbar');
    expect(withContentOverrides).toHaveBeenCalledWith(
      expect.objectContaining({ Navbar: expect.any(Object) }),
      'uk'
    );
  });

  it('falls back to Polish for a missing or unknown language', async () => {
    for (const requested of [undefined, 'de']) {
      const { locale } = await config({
        requestLocale: Promise.resolve(requested),
      });
      expect(locale).toBe('pl');
    }
  });
});

describe('setPageLocale', () => {
  it('accepts a site language and answers 404 for anything else', () => {
    expect(setPageLocale('en')).toBe('en');
    expect(() => setPageLocale('wp-admin')).toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
