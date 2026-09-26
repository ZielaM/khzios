/**
 * Photos of page sections, managed in the admin panel:
 *
 *   hero          home page cross-fade (all photos, in order)
 *   about-us      "About us" header photo (first)
 *   student       student zone header photo (first)
 *   contact       building photo next to the map (first)
 *   teams/<slug>  team header, structure page card and share image (first)
 *
 * A section without photos renders its photo-less variant.
 */

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { resolveTranslation } from '@/lib/translations';

export const IMAGE_SECTIONS = {
  hero: 'hero',
  aboutUs: 'about-us',
  student: 'student',
  contact: 'contact',
  team: (slug: string) => `teams/${slug}`,
} as const;

export interface SiteImage {
  /** Public URL, e.g. /media/obora-3f9a1c2b7d4e.webp */
  src: string;
  alt: string;
}

// One query per section and request, however many components ask
const loadSection = cache((section: string) =>
  prisma.siteImage.findMany({
    where: { section },
    include: { translations: true },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
  })
);

/**
 * Photos of a section in order, with the alt text in the page language
 * (falling back along the usual language chain, then to fallbackAlt).
 */
export async function getSectionImages(
  section: string,
  locale: string,
  fallbackAlt = ''
): Promise<SiteImage[]> {
  const rows = await loadSection(section);
  return rows.map((row) => ({
    src: row.url,
    alt:
      resolveTranslation(row.translations, locale).translation?.alt ||
      fallbackAlt,
  }));
}

/** Photo URLs of every section, for the image sitemap. */
export async function getSectionImageUrls() {
  const rows = await prisma.siteImage.findMany({
    select: { section: true, url: true },
    orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
  });
  const bySection = new Map<string, string[]>();
  for (const { section, url } of rows) {
    bySection.set(section, [...(bySection.get(section) ?? []), url]);
  }
  return (section: string) => bySection.get(section) ?? [];
}

/** The first photo of a section, or null when it has none. */
export async function getSectionImage(
  section: string,
  locale: string,
  fallbackAlt = ''
): Promise<SiteImage | null> {
  return (await getSectionImages(section, locale, fallbackAlt))[0] ?? null;
}
