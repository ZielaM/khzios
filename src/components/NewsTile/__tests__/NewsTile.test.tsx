import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Tag, TagTranslation, Photo } from '@/generated/prisma/client';
import NewsTile from '../NewsTile';
import { LanguageCode } from '@/types/search-types';

// ─── Helpers ───────────────────────────────────────────────────────────

function mockNewsData(
  overrides: Partial<Parameters<typeof NewsTile>[0]['news']> = {}
) {
  return {
    id: 'test-id-1',
    createdAt: new Date('2025-06-15T10:00:00Z'),
    updatedAt: new Date('2025-06-15T10:00:00Z'),
    published: true,
    tags: [],
    photos: [],
    translations: [
      {
        newsId: 'test-id-1',
        languageCode: 'en' as const,
        title: 'Test Article Title',
        content: 'This is test content for the article.',
      },
    ],
    ...overrides,
  };
}

// ─── Rendering Tests ─────────────────────────────────────────────────

describe('NewsTile', () => {
  describe('rendering', () => {
    it('should render the article title', () => {
      render(<NewsTile news={mockNewsData()} locale="en" />);

      expect(screen.getByTestId('news-title')).toHaveTextContent(
        'Test Article Title'
      );
    });

    it('should render the formatted date', () => {
      render(<NewsTile news={mockNewsData()} locale="en" />);

      // Intl.DateTimeFormat with locale 'en' produces something like "June 15, 2025"
      expect(screen.getByText(/June/)).toBeInTheDocument();
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });

    it('should render tag names', () => {
      const news = mockNewsData({
        tags: [
          {
            id: 'tag-1',
            name: 'dogs',
            translations: [
              {
                id: 't1',
                tagId: 'tag-1',
                languageCode: 'en' as LanguageCode,
                name: 'Dogs',
              },
            ],
          },
          {
            id: 'tag-2',
            name: 'cats',
            translations: [
              {
                id: 't2',
                tagId: 'tag-2',
                languageCode: 'en' as LanguageCode,
                name: 'Cats',
              },
            ],
          },
        ] as unknown as (Tag & { translations: TagTranslation[] })[],
      });
      render(<NewsTile news={news} locale="en" />);

      expect(screen.getByText('Dogs')).toBeInTheDocument();
      expect(screen.getByText('Cats')).toBeInTheDocument();
    });

    it('should use placeholder image when no photos are available', () => {
      render(<NewsTile news={mockNewsData()} locale="en" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/placeholder-image.png');
    });

    it('should use first photo as thumbnail when photos exist', () => {
      const news = mockNewsData({
        photos: [
          { id: 'p1', newsId: 'test-id-1', url: '/photo1.jpg', altText: null },
        ] as unknown as Photo[],
      });
      render(<NewsTile news={news} locale="en" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/photo1.jpg');
    });

    it('should render a link to the article detail page', () => {
      render(<NewsTile news={mockNewsData()} locale="en" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/news/test-id-1');
    });
  });

  // ─── Translation Fallback ──────────────────────────────────────────

  describe('translation fallback', () => {
    it('should show fallback badge when translation is in a different language', () => {
      const news = mockNewsData({
        translations: [
          {
            newsId: 'test-id-1',
            languageCode: 'en' as const,
            title: 'English Fallback',
            content: 'Content',
          },
        ],
      });
      // Requesting 'uk' but only 'en' exists → fallback
      render(<NewsTile news={news} locale="uk" />);

      expect(screen.getByTestId('news-fallback-badge')).toBeInTheDocument();
    });

    it('should NOT show fallback badge for exact locale match', () => {
      render(<NewsTile news={mockNewsData()} locale="en" />);

      expect(
        screen.queryByTestId('news-fallback-badge')
      ).not.toBeInTheDocument();
    });

    it('should show "Translation missing" when no translations exist', () => {
      const news = mockNewsData({ translations: [] });
      render(<NewsTile news={news} locale="en" />);

      expect(screen.getByTestId('news-title')).toHaveTextContent(
        'Translation missing'
      );
    });
  });

  // ─── XSS / Sanitization ───────────────────────────────────────────

  describe('XSS protection', () => {
    it('should sanitize HTML in title via DOMPurify', () => {
      const news = mockNewsData({
        translations: [
          {
            newsId: 'test-id-1',
            languageCode: 'en' as const,
            title: 'Safe <mark>highlighted</mark> title',
            content: 'Content',
          },
        ],
      });
      render(<NewsTile news={news} locale="en" />);

      const titleEl = screen.getByTestId('news-title');
      // <mark> is allowed by DOMPurify
      expect(titleEl.innerHTML).toContain('<mark>');
      // <script> would be stripped
      expect(titleEl.innerHTML).not.toContain('<script>');
    });

    it('should strip dangerous script tags from content', () => {
      const news = mockNewsData({
        translations: [
          {
            newsId: 'test-id-1',
            languageCode: 'en' as const,
            title: 'Title',
            content: 'Hello <script>alert("xss")</script> world',
          },
        ],
      });
      render(<NewsTile news={news} locale="en" />);

      const container = screen.getByTestId('news-tile');
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.textContent).toContain('Hello');
    });
  });
});
