import { describe, it, expect } from 'vitest';
import { generateRssFeed } from '../rss';

// ─── Helpers ───────────────────────────────────────────────────────────

/** Creates a minimal News+Translations mock matching the Prisma shape */
function mockNews(
  id: string,
  translations: { languageCode: string; title: string; content: string }[],
  createdAt: Date = new Date('2025-06-01T12:00:00Z')
) {
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    published: true,
    translations: translations.map((t) => ({
      newsId: id,
      languageCode: t.languageCode as any,
      title: t.title,
      content: t.content,
      searchVector: null,
    })),
  };
}

const BASE_URL = 'https://khzios.up.poznan.pl';

// ─── Typical Values ──────────────────────────────────────────────────

describe('generateRssFeed', () => {
  describe('typical values', () => {
    it('should generate valid RSS XML with basic news items', () => {
      const news = [
        mockNews('id-1', [
          { languageCode: 'pl', title: 'Tytuł 1', content: 'Treść artykułu' },
        ]),
      ];
      const feed = generateRssFeed(news, 'pl', BASE_URL, 'Aktualności');

      expect(feed).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
      expect(feed).toContain('<rss version="2.0">');
      expect(feed).toContain('Tytuł 1');
      expect(feed).toContain('Treść artykułu');
      expect(feed).toContain(`${BASE_URL}/pl/news/id-1`);
    });

    it('should include channel metadata', () => {
      const feed = generateRssFeed([], 'en', BASE_URL, 'News');

      expect(feed).toContain('<language>en</language>');
      expect(feed).toContain(`${BASE_URL}/en/news`);
      expect(feed).toContain('News - KHZiOS');
    });

    it('should format pubDate as UTC string', () => {
      const date = new Date('2025-03-15T10:30:00Z');
      const news = [
        mockNews(
          'id-1',
          [
            {
              languageCode: 'en',
              title: 'Test',
              content: 'Content',
            },
          ],
          date
        ),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      expect(feed).toContain(
        '<pubDate>Sat, 15 Mar 2025 10:30:00 GMT</pubDate>'
      );
    });

    it('should generate multiple items', () => {
      const news = [
        mockNews('id-1', [
          { languageCode: 'en', title: 'First', content: 'Content 1' },
        ]),
        mockNews('id-2', [
          { languageCode: 'en', title: 'Second', content: 'Content 2' },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      expect(feed).toContain('First');
      expect(feed).toContain('Second');
      // Count <item> tags
      const itemCount = (feed.match(/<item>/g) || []).length;
      expect(itemCount).toBe(2);
    });
  });

  // ─── Translation Fallback in RSS ───────────────────────────────────

  describe('translation fallback', () => {
    it('should use fallback translation when locale is missing', () => {
      const news = [
        mockNews('id-1', [
          { languageCode: 'pl', title: 'Polski tytuł', content: 'Treść' },
          { languageCode: 'en', title: 'English title', content: 'Content' },
        ]),
      ];
      // Requesting "uk" which is not available — falls back to "en"
      const feed = generateRssFeed(news, 'uk', BASE_URL, 'News');

      expect(feed).toContain('English title');
      expect(feed).not.toContain('Polski tytuł');
    });

    it('should use first translation as ultimate fallback when no chain matches', () => {
      const news = [
        mockNews('id-1', [
          { languageCode: 'de', title: 'Deutscher Titel', content: 'Inhalt' },
        ]),
      ];
      // "en" chain: [en, pl] → neither matches "de", so resolveTranslation
      // returns undefined, and the code falls back to translations[0]
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      expect(feed).toContain('Deutscher Titel');
    });
  });

  // ─── HTML Stripping ────────────────────────────────────────────────

  describe('HTML stripping from content', () => {
    it('should strip HTML tags from content in the description', () => {
      const news = [
        mockNews('id-1', [
          {
            languageCode: 'en',
            title: 'Test',
            content: '<p>Hello <b>world</b></p>',
          },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      expect(feed).toContain('Hello world');
      expect(feed).not.toContain('<p>');
      expect(feed).not.toContain('<b>');
    });

    it('should strip self-closing tags', () => {
      const news = [
        mockNews('id-1', [
          {
            languageCode: 'en',
            title: 'Test',
            content: 'Before<br/>After<img src="x.png"/>End',
          },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      expect(feed).toContain('BeforeAfterEnd');
    });
  });

  // ─── XML Injection / CDATA Escape ──────────────────────────────────

  describe('XML Injection resistance (CDATA escaping)', () => {
    it('should escape CDATA closing sequence in title', () => {
      const news = [
        mockNews('id-1', [
          {
            languageCode: 'en',
            title: 'Attack ]]><script>alert("xss")</script>',
            content: 'Safe content',
          },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      // The raw ]]> should be escaped so it doesn't break CDATA
      expect(feed).not.toContain(']]><script>');
      expect(feed).toContain(']]]]><![CDATA[>');
    });

    it('should escape CDATA closing sequence in content', () => {
      const news = [
        mockNews('id-1', [
          {
            languageCode: 'en',
            title: 'Normal title',
            content: 'Content with ]]> injection ]]> attempt',
          },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      // Content is first HTML-stripped then CDATA-escaped.
      // Verify the injected ]]> sequences are escaped (not raw).
      // The legitimate CDATA close ]]></description> is fine — we check
      // that the *injected* ]]> was split into ]]]]><![CDATA[>
      expect(feed).toContain(
        ']]]]><![CDATA[> injection ]]]]><![CDATA[> attempt'
      );
      expect(feed).toContain(']]]]><![CDATA[>');
    });

    it('should escape CDATA closing sequence in site title', () => {
      const news: any[] = [];
      const maliciousTitle = 'News ]]><evil>hack</evil>';
      const feed = generateRssFeed(news, 'en', BASE_URL, maliciousTitle);

      expect(feed).not.toContain(']]><evil>');
      expect(feed).toContain(']]]]><![CDATA[>');
    });

    it('should handle multiple ]]> sequences in a single field', () => {
      const news = [
        mockNews('id-1', [
          {
            languageCode: 'en',
            title: 'A]]>B]]>C',
            content: 'X]]>Y]]>Z',
          },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      // Each ]]> should be independently escaped
      const escapeCount = (feed.match(/\]\]\]\]><!\[CDATA\[>/g) || []).length;
      // title has 2 + content has 2 = 4 escapes
      expect(escapeCount).toBe(4);
    });

    it('should produce well-formed XML even with adversarial input', () => {
      const news = [
        mockNews('id-1', [
          {
            languageCode: 'en',
            title: ']]>]]>]]>',
            content: '<script>]]></script>',
          },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      // Every CDATA section should be properly closed
      const cdataOpens = (feed.match(/<!\[CDATA\[/g) || []).length;
      const cdataCloses = (feed.match(/\]\]>/g) || []).length;
      // Each CDATA open should have a corresponding close
      expect(cdataCloses).toBeGreaterThanOrEqual(cdataOpens);
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty news array', () => {
      const feed = generateRssFeed([], 'pl', BASE_URL, 'Aktualności');

      expect(feed).toContain('<?xml version="1.0" encoding="UTF-8" ?>');
      expect(feed).toContain('<channel>');
      expect(feed).not.toContain('<item>');
    });

    it('should handle news with empty content', () => {
      const news = [
        mockNews('id-1', [{ languageCode: 'en', title: 'Title', content: '' }]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      expect(feed).toContain('<item>');
      expect(feed).toContain('Title');
    });

    it('should handle Unicode characters in title and content', () => {
      const news = [
        mockNews('id-1', [
          {
            languageCode: 'uk',
            title: 'Новини тваринництва 🐄',
            content: 'Зміст із українськими символами',
          },
        ]),
      ];
      const feed = generateRssFeed(news, 'uk', BASE_URL, 'Новини');

      expect(feed).toContain('Новини тваринництва 🐄');
      expect(feed).toContain('Зміст із українськими символами');
    });

    it('should set guid as permalink with the correct URL', () => {
      const news = [
        mockNews('id-abc', [
          { languageCode: 'en', title: 'Test', content: 'Content' },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      expect(feed).toContain(
        `<guid isPermaLink="true">${BASE_URL}/en/news/id-abc</guid>`
      );
    });

    it('should skip news items with no translations instead of crashing', () => {
      const news = [
        mockNews('id-empty', []),
        mockNews('id-ok', [
          { languageCode: 'en', title: 'Valid', content: 'Content' },
        ]),
      ];
      const feed = generateRssFeed(news, 'en', BASE_URL, 'News');

      // The item with no translations should be skipped
      expect(feed).not.toContain('id-empty');
      // The valid item should still be present
      expect(feed).toContain('Valid');
    });
  });
});
