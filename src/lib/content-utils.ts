/**
 * Content utility functions for news articles.
 *
 * Text helpers built on DOMPurify: plain-text conversion, excerpts,
 * inline HTML sanitisation and reading time. Server-side use only, to keep
 * DOMPurify out of client bundles.
 */

import DOMPurify from 'isomorphic-dompurify';

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

/**
 * Plain text with only the <mark> highlights added by search. Script and
 * style elements go first, together with their text, before the remaining
 * tags are unwrapped.
 */
export function keepMarksOnly(html: string): string {
  return DOMPurify.sanitize(
    DOMPurify.sanitize(html, { FORBID_TAGS: ['style', 'script'] }),
    { ALLOWED_TAGS: ['mark'] }
  );
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
