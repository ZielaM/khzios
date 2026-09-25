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
 * Strips all HTML tags from a string using DOMPurify with no allowed tags.
 * More robust than regex — correctly handles nested tags, HTML entities
 * (&amp;, &lt;), and malformed markup.
 * Useful for generating clean alt text and meta descriptions.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }
  // Pass 1: Forbid tags entirely (removes content)
  const cleanHtml = DOMPurify.sanitize(html, {
    FORBID_TAGS: ['style', 'script'],
  });
  // Pass 2: Strip all remaining HTML tags
  return DOMPurify.sanitize(cleanHtml, { ALLOWED_TAGS: [] });
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
