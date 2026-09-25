/**
 * Content utility functions for news articles.
 *
 * Provides shared helpers for photo fallback resolution,
 * HTML sanitization (XSS-safe text stripping), and
 * reading time estimation used across the application.
 */

import { Photo } from '@/generated/prisma/client';
import DOMPurify from 'isomorphic-dompurify';
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

/**
 * Plain text of an HTML fragment: tags removed, <script>/<style> contents
 * dropped and entities decoded. Render the result as text, never as HTML.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }
  const fragment = DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'script'],
    RETURN_DOM_FRAGMENT: true,
  });
  return (fragment.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitises short inline HTML such as a publication title: keeps search
 * highlights and the formatting scientific titles use (italic species names,
 * sub/superscripts) and removes everything else.
 */
export function sanitizeInlineHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['mark', 'i', 'em', 'b', 'strong', 'sub', 'sup'],
    ALLOWED_ATTR: [],
  });
}

/** Shortens plain text to at most `maxLength` characters on a word boundary. */
export function excerpt(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

/**
 * Estimates reading time in minutes based on word count.
 * Uses an average reading speed of ~200 words per minute.
 */
export function estimateReadingTime(htmlContent: string): number {
  const text = stripHtml(htmlContent);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
