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
  // A fragment's textContent is always a string (null only for documents)
  return String(fragment.textContent).replace(/\s+/g, ' ').trim();
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

// Elements articles may contain; each has a style on the article page and a
// button in the panel's editor. Everything else is removed.
const ARTICLE_TAGS = [
  'p',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'blockquote',
  'a',
  'br',
  'div',
];
const ARTICLE_CLASSES = new Set(['highlight-box']);
const SAFE_LINK = /^(https?:|mailto:|\/)/i;

/**
 * Article body HTML limited to the predefined formatting: paragraphs,
 * h2/h3 headings, lists, bold, italics, quotes, links (http, https, mailto
 * or site paths) and the highlighted box (<div class="highlight-box">).
 */
export function sanitizeArticleHtml(html: string): string {
  if (typeof html !== 'string') return '';
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'class') {
      const kept = data.attrValue
        .split(/\s+/)
        .filter((name) => node.nodeName === 'DIV' && ARTICLE_CLASSES.has(name));
      data.attrValue = kept.join(' ');
      if (kept.length === 0) data.keepAttr = false;
    }
    if (data.attrName === 'href' && !SAFE_LINK.test(data.attrValue.trim())) {
      data.keepAttr = false;
    }
  });
  try {
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ARTICLE_TAGS,
      ALLOWED_ATTR: ['href', 'class'],
    });
    // A <div> is only allowed as the highlighted box; unwrap the rest
    return clean.replace(/<div>([\s\S]*?)<\/div>/g, '$1');
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute');
  }
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
