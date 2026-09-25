import { describe, it, expect } from 'vitest';
import { getPhotoAlt, getPhotoUrl } from '../photos';
import type { Photo } from '@/generated/prisma/client';

// ─── getPhotoUrl ────────────────────────────────────────────────────────

describe('getPhotoUrl', () => {
  it('should return the first photo URL when photos exist', () => {
    const photos = [
      { id: 'p1', newsId: 'n1', url: '/photo1.jpg' },
      { id: 'p2', newsId: 'n1', url: '/photo2.jpg' },
    ] as Photo[];

    expect(getPhotoUrl(photos)).toBe('/photo1.jpg');
  });

  it('should return placeholder when photos array is empty', () => {
    expect(getPhotoUrl([])).toBe('/placeholder-image.png');
  });

  it('should return placeholder for undefined', () => {
    expect(getPhotoUrl(undefined as unknown as Photo[])).toBe(
      '/placeholder-image.png'
    );
  });

  it('should return placeholder for wrong type', () => {
    expect(getPhotoUrl(2137 as unknown as Photo[])).toBe(
      '/placeholder-image.png'
    );
  });
});

// ─── getPhotoAlt ────────────────────────────────────────────────────────

describe('getPhotoAlt', () => {
  const photo = {
    translations: [
      { languageCode: 'pl', alt: 'Krowy na pastwisku' },
      { languageCode: 'en', alt: 'Cows on a pasture' },
    ],
  };

  it('returns the alt text in the requested language', () => {
    expect(getPhotoAlt(photo, 'pl', 'x')).toBe('Krowy na pastwisku');
  });

  it('follows the translation fallback chain', () => {
    expect(getPhotoAlt(photo, 'uk', 'x')).toBe('Cows on a pasture');
  });

  it('uses the fallback for photos without alt text', () => {
    expect(getPhotoAlt({ translations: [] }, 'pl', 'Tytuł')).toBe('Tytuł');
    expect(getPhotoAlt(undefined, 'pl', 'Tytuł')).toBe('Tytuł');
    expect(
      getPhotoAlt(
        { translations: [{ languageCode: 'pl', alt: ' ' }] },
        'pl',
        'T'
      )
    ).toBe('T');
  });
});
