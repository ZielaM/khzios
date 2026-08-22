import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewsGridServer from '../NewsGridServer';
import { searchPublishedNews } from '@/actions/search';
import type { Prisma } from '@/generated/prisma/client';

vi.mock('@/actions/search', () => ({
  searchPublishedNews: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

// Mock returned items
type SearchResultItem = Prisma.NewsGetPayload<{
  include: {
    translations: true;
    photos: true;
    tags: { include: { translations: true } };
  };
}>;

function mockSearchResult(id: string): SearchResultItem {
  return {
    id,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    published: true,
    tags: [],
    photos: [],
    translations: [
      {
        newsId: id,
        languageCode: 'en',
        title: `Search Result ${id}`,
        content: `Content ${id}`,
      },
    ],
  };
}

describe('NewsGridServer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render "noResults" message when query returns 0 items', async () => {
    vi.mocked(searchPublishedNews).mockResolvedValue({
      data: [],
      totalPages: 0,
      total: 0,
      page: 1,
    });

    const jsx = await NewsGridServer({
      query: 'NotFound',
      locale: 'en',
      page: 1,
      limit: 10,
      sortBy: 'date',
    });
    render(jsx);

    // Checks that the searchX icon or text is present
    expect(screen.getByText('noResults')).toBeInTheDocument();
  });

  it('should render NewsTiles and Pagination when data is present', async () => {
    vi.mocked(searchPublishedNews).mockResolvedValue({
      data: [mockSearchResult('1'), mockSearchResult('2')],
      totalPages: 2,
      total: 2,
      page: 1,
    });

    const jsx = await NewsGridServer({
      locale: 'en',
      page: 1,
      limit: 10,
      sortBy: 'date',
    });
    render(jsx);

    // 2 NewsTiles -> 2 links
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    // Load More container
    expect(
      screen.getByRole('button', { name: /loadMore/i })
    ).toBeInTheDocument();
  });
});
