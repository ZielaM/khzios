import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RelatedNews from '../RelatedNews';
import { getRelatedNews } from '@/lib/news-queries';

// Mocking the server query
vi.mock('@/lib/news-queries', () => ({
  getRelatedNews: vi.fn(),
}));

// Mocking server-side getTranslations
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

type RelatedArticle = Awaited<ReturnType<typeof getRelatedNews>>[number];

// Helper to construct Prisma mock data
function mockArticle(
  id: string,
  overrides: Partial<RelatedArticle> = {}
): RelatedArticle {
  return {
    id,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    published: true,
    tags: [],
    photos: [],
    translations: [
      {
        id: `t-${id}`,
        newsId: id,
        languageCode: 'en',
        title: `Article Title ${id}`,
        content: `Content ${id}`,
      },
    ],
    ...overrides,
  } as unknown as RelatedArticle;
}

describe('RelatedNews Server Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render nothing (null) if no articles are found', async () => {
    // Mock the query to return empty array
    vi.mocked(getRelatedNews).mockResolvedValue([]);

    const jsx = await RelatedNews({
      newsId: '1',
      tagIds: ['tag1'],
      locale: 'en',
    });

    // An async component returns a JSX element, which we can render.
    // If it returns null, render yields empty container.
    const { container } = render(jsx);

    expect(container.innerHTML).toBe('');
    expect(getRelatedNews).toHaveBeenCalledWith('1', ['tag1'], 3);
  });

  it('should render the related news section and title when articles exist', async () => {
    vi.mocked(getRelatedNews).mockResolvedValue([mockArticle('2')]);

    const jsx = await RelatedNews({
      newsId: '1',
      tagIds: ['tag1'],
      locale: 'en',
    });
    render(jsx);

    // Checks if the section heading exists (mocked translation returns "relatedArticles")
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'relatedArticles'
    );
  });

  it('should render exactly the number of articles returned (e.g. 2)', async () => {
    vi.mocked(getRelatedNews).mockResolvedValue([
      mockArticle('2'),
      mockArticle('3'),
    ]);

    const jsx = await RelatedNews({
      newsId: '1',
      tagIds: ['tag1'],
      locale: 'en',
    });
    render(jsx);

    // 2 links for the cards
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/news/2');
    expect(links[1]).toHaveAttribute('href', '/news/3');
  });

  it('should correctly strip HTML and display the article title', async () => {
    vi.mocked(getRelatedNews).mockResolvedValue([
      mockArticle('2', {
        translations: [
          {
            newsId: '2',
            languageCode: 'en',
            title: 'Title with <mark>highlight</mark>',
            content: '',
          },
        ],
      }),
    ]);

    const jsx = await RelatedNews({
      newsId: '1',
      tagIds: ['tag1'],
      locale: 'en',
    });
    render(jsx);

    // HTML should be stripped from the card title
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Title with highlight'
    );
  });

  it('should render correct placeholder when article has no photos', async () => {
    vi.mocked(getRelatedNews).mockResolvedValue([mockArticle('2')]);

    const jsx = await RelatedNews({
      newsId: '1',
      tagIds: ['tag1'],
      locale: 'en',
    });
    render(jsx);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/placeholder-image.png');
  });

  it('should render actual photo URL when article has photos', async () => {
    vi.mocked(getRelatedNews).mockResolvedValue([
      mockArticle('2', {
        photos: [{ id: 'p1', newsId: '2', url: '/custom-photo.jpg' }],
      }),
    ]);

    const jsx = await RelatedNews({
      newsId: '1',
      tagIds: ['tag1'],
      locale: 'en',
    });
    render(jsx);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/custom-photo.jpg');
  });
});
