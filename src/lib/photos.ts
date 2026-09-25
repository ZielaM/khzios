/**
 * Article photo helpers. Kept free of DOMPurify so client components (the
 * gallery) can use them without pulling the sanitiser into the browser.
 */

import type { Photo } from '@/generated/prisma/client';
import { resolveTranslation } from '@/lib/translations';

/** Static fallback image for articles without uploaded photos */
const PLACEHOLDER_IMAGE = '/placeholder-image.png';

/**
 * Resolves the primary photo URL from a photos array.
 * Returns the first available photo URL or the default placeholder.
 */
export function getPhotoUrl(photos: Photo[] | null | undefined): string {
  return photos && photos?.length > 0 ? photos[0].url : PLACEHOLDER_IMAGE;
}

/**
 * Alternative text of a photo in the requested language (following the usual
 * translation fallback chain), or `fallback` when the photo has none.
 */
export function getPhotoAlt(
  photo: { translations?: { languageCode: string; alt: string }[] } | undefined,
  locale: string,
  fallback: string
): string {
  const { translation } = resolveTranslation(photo?.translations ?? [], locale);
  return translation?.alt.trim() || fallback;
}
