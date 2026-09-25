import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  buildAlternates,
  getAppUrl,
  listingMetadata,
  pageMetadata,
  toAbsoluteUrl,
} from '../seo';

// The global setup replaces routing with a Link stub; these tests need the
// real localized pathnames
vi.mock('@/i18n/routing', async (importOriginal) => importOriginal());
vi.mock('next/navigation', async (importOriginal) => importOriginal());

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue(() => 'Katedra'),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getAppUrl', () => {
  it('uses APP_URL when set', () => {
    vi.stubEnv('APP_URL', 'https://example.org');
    expect(getAppUrl()).toBe('https://example.org');
  });

  it('falls back to the production domain', () => {
    vi.stubEnv('APP_URL', '');
    expect(getAppUrl()).toBe('https://khzios.up.poznan.pl');
  });
});

describe('toAbsoluteUrl', () => {
  it('prefixes site-relative paths with the app URL', () => {
    vi.stubEnv('APP_URL', 'https://example.org');
    expect(toAbsoluteUrl('/images/hero/a.jpg')).toBe(
      'https://example.org/images/hero/a.jpg'
    );
  });

  it('leaves absolute URLs untouched', () => {
    expect(toAbsoluteUrl('https://cdn.example.org/a.jpg')).toBe(
      'https://cdn.example.org/a.jpg'
    );
  });
});

describe('buildAlternates', () => {
  it('points to the localized address in every language', () => {
    expect(buildAlternates('/contact', 'en')).toEqual({
      canonical: '/en/contact',
      languages: {
        pl: '/pl/kontakt',
        en: '/en/contact',
        uk: '/uk/kontakt',
        ru: '/ru/kontakt',
        'x-default': '/pl/kontakt',
      },
    });
  });

  it('supports per-language slugs', () => {
    const alternates = buildAlternates(
      (locale) => ({
        pathname: '/about-us/structure/[team]',
        params: { team: locale === 'pl' ? 'przezuwajace' : 'ruminants' },
      }),
      'pl'
    );
    expect(alternates.canonical).toBe('/pl/o-nas/struktura/przezuwajace');
    expect(alternates.languages).toMatchObject({
      en: '/en/about-us/structure/ruminants',
    });
  });
});

describe('pageMetadata', () => {
  it('sets canonical, share title and the default image', async () => {
    const meta = await pageMetadata({
      locale: 'pl',
      href: '/student',
      title: 'Dla studentów',
      description: 'Opis',
    });

    expect(meta.title).toBe('Dla studentów');
    expect(meta.alternates?.canonical).toBe('/pl/student');
    expect(meta.openGraph).toMatchObject({
      url: '/pl/student',
      title: 'Dla studentów | Katedra',
      siteName: 'Katedra',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    });
  });

  it('uses the page photo when there is one', async () => {
    const meta = await pageMetadata({
      locale: 'pl',
      href: '/about-us',
      title: 'O nas',
      image: { src: '/images/a.jpg', alt: 'Budynek' },
    });
    expect(meta.openGraph?.images).toEqual([
      { url: '/images/a.jpg', alt: 'Budynek' },
    ]);
    expect(meta.twitter).toMatchObject({ images: ['/images/a.jpg'] });
  });
});

describe('listingMetadata', () => {
  it('keeps plain listing pages indexable with a self-referencing canonical', async () => {
    const meta = await listingMetadata({
      locale: 'pl',
      pathname: '/news',
      searchParams: { page: '2' },
    });
    expect(meta.alternates?.canonical).toBe('/pl/aktualnosci?page=2');
    expect(meta.robots).toBeUndefined();
  });

  it('does not index search and filter results', async () => {
    const meta = await listingMetadata({
      locale: 'pl',
      pathname: '/news',
      searchParams: { query: 'krowy' },
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe('/pl/aktualnosci');
  });
});
