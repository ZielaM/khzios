import { describe, it, expect, afterEach, vi } from 'vitest';
import { buildShareMetadata, getAppUrl, toAbsoluteUrl } from '../seo';

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

describe('buildShareMetadata', () => {
  it('returns nothing without an image so layout defaults apply', () => {
    expect(buildShareMetadata('Title', null)).toEqual({});
  });

  it('builds OpenGraph and Twitter images from the page photo', () => {
    const meta = buildShareMetadata(
      'Title',
      { src: '/images/a.jpg', alt: 'Barn' },
      'Desc'
    );

    expect(meta.openGraph).toEqual({
      title: 'Title',
      description: 'Desc',
      images: [{ url: '/images/a.jpg', alt: 'Barn' }],
    });
    expect(meta.twitter).toMatchObject({ images: ['/images/a.jpg'] });
  });

  it('uses the title as alt when the photo has none', () => {
    const meta = buildShareMetadata('Title', { src: '/a.jpg', alt: '' });
    expect(meta.openGraph?.images).toEqual([{ url: '/a.jpg', alt: 'Title' }]);
  });
});
