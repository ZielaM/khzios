import { describe, it, expect } from 'vitest';
import { getPhotoUrl, stripHtml, estimateReadingTime } from '../content-utils';
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

// ─── stripHtml ──────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('should remove HTML tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe(
      'Hello world'
    );
  });

  it('should handle wrong input', () => {
    expect(stripHtml(undefined as unknown as string)).toBe('');
    expect(stripHtml(2137 as unknown as string)).toBe('');
  });
});

// ─── estimateReadingTime ────────────────────────────────────────────────

describe('estimateReadingTime', () => {
  it('should return 1 minute for very short content', () => {
    expect(estimateReadingTime('Hello world')).toBe(1);
  });

  it('should return 1 minute for empty content', () => {
    expect(estimateReadingTime('')).toBe(1);
  });

  it('should calculate correct reading time for longer content', () => {
    const words = Array(400).fill('word').join(' ');
    expect(estimateReadingTime(words)).toBe(2);
  });

  it('should round up partial minutes', () => {
    const words = Array(250).fill('word').join(' ');
    expect(estimateReadingTime(words)).toBe(2);
  });

  it('should strip HTML before counting words', () => {
    // 200 words inside 2 <p> tags with extra spaces
    const html = `<p> ${Array(200).fill('word').join(' ')} </p>`;
    expect(estimateReadingTime(html)).toBe(1);
  });
});
