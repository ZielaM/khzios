/**
 * Centralized photo fallback utilities.
 *
 * Ensures consistent image selection across the entire application.
 * Every component that needs a news thumbnail or hero image
 * should use getPhotoUrl() instead of inlining the fallback logic.
 */

import { Photo } from '@/generated/prisma/client';
import DOMPurify from 'isomorphic-dompurify';

/** Static fallback image for articles without uploaded photos */
const PLACEHOLDER_IMAGE = '/placeholder-image.png';

/**
 * Resolves the primary photo URL from a photos array.
 * Returns the first available photo URL or the default placeholder.
 */
export function getPhotoUrl(photos: Photo[]): string {
  return photos.length > 0 ? photos[0].url : PLACEHOLDER_IMAGE;
}

/**
 * Strips all HTML tags from a string using DOMPurify with no allowed tags.
 * More robust than regex — correctly handles nested tags, HTML entities
 * (&amp;, &lt;), and malformed markup.
 * Useful for generating clean alt text and meta descriptions.
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
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
