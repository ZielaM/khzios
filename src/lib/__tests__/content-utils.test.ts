import { describe, it, expect } from 'vitest';
import {
  stripHtml,
  excerpt,
  sanitizeInlineHtml,
  estimateReadingTime,
} from '../content-utils';

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

// ─── stripHtml (plain text) ─────────────────────────────────────────────

describe('stripHtml plain text output', () => {
  it('decodes entities and collapses whitespace', () => {
    expect(stripHtml('\n  <p>Ryby &amp; drób</p>\n  <p>a &lt; b</p>')).toBe(
      'Ryby & drób a < b'
    );
  });

  it('drops script and style contents', () => {
    expect(
      stripHtml('<style>p{}</style><p>Tekst</p><script>x()</script>')
    ).toBe('Tekst');
  });
});

// ─── excerpt ────────────────────────────────────────────────────────────

describe('excerpt', () => {
  it('returns short text unchanged', () => {
    expect(excerpt('Krótki tekst', 50)).toBe('Krótki tekst');
  });

  it('cuts on a word boundary and adds an ellipsis', () => {
    expect(excerpt('Hodowla bydła mlecznego w Polsce', 20)).toBe(
      'Hodowla bydła…'
    );
  });

  it('does not leave trailing punctuation before the ellipsis', () => {
    expect(excerpt('Jeden, dwa, trzy cztery', 11)).toBe('Jeden, dwa…');
  });
});

// ─── sanitizeInlineHtml ─────────────────────────────────────────────────

describe('sanitizeInlineHtml', () => {
  it('keeps highlights and scientific formatting', () => {
    expect(
      sanitizeInlineHtml('<mark>Mleko</mark> <i>Bos taurus</i> CO<sub>2</sub>')
    ).toBe('<mark>Mleko</mark> <i>Bos taurus</i> CO<sub>2</sub>');
  });

  it('removes scripts, event handlers and other markup', () => {
    expect(
      sanitizeInlineHtml(
        '<img src=x onerror="alert(1)"><a href="javascript:x">Tytuł</a><script>x()</script>'
      )
    ).toBe('Tytuł');
    expect(sanitizeInlineHtml('<i onclick="x()">Gatunek</i>')).toBe(
      '<i>Gatunek</i>'
    );
  });
});
