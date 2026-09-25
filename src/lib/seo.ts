/**
 * Shared SEO helpers: canonical site URL and share (OpenGraph) images.
 */

import type { Metadata } from 'next';
import { getAppUrl } from '@/lib/env';

export { getAppUrl };

/** Default share image (1200×630) used when a page has no photo of its own */
export const DEFAULT_OG_IMAGE = '/og-image.png';

/** Square logo referenced from JSON-LD structured data */
export const LOGO_IMAGE = '/logo-seal.png';

/** Turns a site-relative path (`/images/...`) into an absolute URL. */
export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, getAppUrl()).toString();
}

/**
 * Builds OpenGraph + Twitter metadata for a page with its own photo.
 * Child `openGraph` replaces the layout's object entirely, so the title
 * and description are repeated here. Without an image the layout's
 * defaults are kept by returning nothing.
 */
export function buildShareMetadata(
  title: string,
  image: { src: string; alt: string } | null,
  description?: string
): Pick<Metadata, 'openGraph' | 'twitter'> {
  if (!image) return {};

  return {
    openGraph: {
      title,
      description,
      images: [{ url: image.src, alt: image.alt || title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.src],
    },
  };
}
