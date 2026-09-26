import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getSectionImage,
  getSectionImages,
  getSectionImageUrls,
  IMAGE_SECTIONS,
} from '../site-images';

vi.mock('@/lib/prisma', () => ({
  prisma: { siteImage: { findMany: vi.fn() } },
}));

const findMany = vi.mocked(prisma.siteImage.findMany);

const row = (url: string, alts: Record<string, string> = {}) => ({
  id: url,
  section: 'hero',
  url,
  displayOrder: 0,
  translations: Object.entries(alts).map(([languageCode, alt]) => ({
    siteImageId: url,
    languageCode,
    alt,
  })),
});

describe('site images', () => {
  beforeEach(() => findMany.mockReset());

  it('returns a section’s photos in the stored order', async () => {
    findMany.mockResolvedValue([
      row('/media/a.webp'),
      row('/media/b.webp'),
    ] as never);
    const images = await getSectionImages('hero', 'pl');
    expect(images.map((i) => i.src)).toEqual([
      '/media/a.webp',
      '/media/b.webp',
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { section: 'hero' } })
    );
  });

  it('picks the alt text along the language fallback chain', async () => {
    findMany.mockResolvedValue([
      row('/media/a.webp', { pl: 'Obora', en: 'Barn' }),
    ] as never);
    expect((await getSectionImages('hero', 'en'))[0].alt).toBe('Barn');
    expect((await getSectionImages('hero', 'uk'))[0].alt).toBe('Barn');
    expect((await getSectionImages('hero', 'pl'))[0].alt).toBe('Obora');
  });

  it('uses the fallback alt for photos without a description', async () => {
    findMany.mockResolvedValue([row('/media/a.webp')] as never);
    expect((await getSectionImages('hero', 'pl', 'Katedra'))[0].alt).toBe(
      'Katedra'
    );
  });

  it('returns the first photo or null', async () => {
    findMany.mockResolvedValueOnce([
      row('/media/a.webp'),
      row('/media/b.webp'),
    ] as never);
    expect(
      (await getSectionImage(IMAGE_SECTIONS.team('poultry'), 'pl'))?.src
    ).toBe('/media/a.webp');
    findMany.mockResolvedValueOnce([] as never);
    expect(
      await getSectionImage(IMAGE_SECTIONS.team('swine'), 'pl')
    ).toBeNull();
  });

  it('groups URLs by section for the sitemap', async () => {
    findMany.mockResolvedValue([
      { section: 'hero', url: '/media/a.webp' },
      { section: 'teams/poultry', url: '/media/b.webp' },
      { section: 'hero', url: '/media/c.webp' },
    ] as never);
    const urls = await getSectionImageUrls();
    expect(urls('hero')).toEqual(['/media/a.webp', '/media/c.webp']);
    expect(urls('contact')).toEqual([]);
  });
});
