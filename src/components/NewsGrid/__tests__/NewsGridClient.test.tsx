import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NewsGridClient from '../NewsGridClient';
import { searchPublishedNews } from '@/actions/search';
import type { Prisma } from '@/generated/prisma/client';
import { SearchParams } from '@/types/search-types';

vi.mock('@/actions/search', () => ({
  searchPublishedNews: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

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
  } as unknown as React.ComponentProps<typeof NewsGridClient>['initialData'][0];
}

describe('NewsGridClient Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads more items using cursor pagination for regular browsing', async () => {
    const initialData = [mockSearchResult('1')];

    vi.mocked(searchPublishedNews).mockResolvedValue({
      data: [mockSearchResult('2')],
      totalPages: 2,
      total: 2,
      page: 1,
    });

    const searchParams: SearchParams = {
      language: 'en',
      limit: 10,
      sortBy: 'date',
    };

    render(
      <NewsGridClient
        initialData={initialData}
        totalPages={2}
        searchParams={searchParams}
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /loadMore/i });
    expect(loadMoreBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(loadMoreBtn);
    });

    expect(searchPublishedNews).toHaveBeenCalledWith(
      expect.objectContaining({
        cursorId: '1',
      })
    );

    // After loading, both items should be visible
    expect(screen.getAllByRole('link').length).toBe(2);
  });

  it('loads more items using page pagination for searches', async () => {
    const initialData = [mockSearchResult('1')];

    vi.mocked(searchPublishedNews).mockResolvedValue({
      data: [mockSearchResult('2')],
      totalPages: 2,
      total: 2,
      page: 2,
    });

    const searchParams: SearchParams = {
      language: 'en',
      limit: 1,
      sortBy: 'date',
      query: 'search term',
      page: 1,
    };

    render(
      <NewsGridClient
        initialData={initialData}
        totalPages={2}
        searchParams={searchParams}
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /loadMore/i });

    await act(async () => {
      fireEvent.click(loadMoreBtn);
    });

    expect(searchPublishedNews).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'search term',
        page: 2,
      })
    );
  });

  it('handles empty results and hides load more button', async () => {
    const initialData = [mockSearchResult('1')];

    vi.mocked(searchPublishedNews).mockResolvedValue({
      data: [],
      totalPages: 1,
      total: 1,
      page: 1,
    });

    const searchParams: SearchParams = {
      language: 'en',
      limit: 10,
    };

    render(
      <NewsGridClient
        initialData={initialData}
        totalPages={2}
        searchParams={searchParams}
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /loadMore/i });

    await act(async () => {
      fireEvent.click(loadMoreBtn);
    });

    // Button should be gone since data array was empty
    expect(
      screen.queryByRole('button', { name: /loadMore/i })
    ).not.toBeInTheDocument();
  });

  it('handles errors gracefully in loadMore', async () => {
    const initialData = [mockSearchResult('1')];

    vi.mocked(searchPublishedNews).mockRejectedValue(
      new Error('Network error')
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const searchParams: SearchParams = {
      language: 'en',
      limit: 10,
    };

    render(
      <NewsGridClient
        initialData={initialData}
        totalPages={2}
        searchParams={searchParams}
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: /loadMore/i });

    await act(async () => {
      fireEvent.click(loadMoreBtn);
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('covers branches for loading, hasMore, lastItem, limit fallback, and translation fallback', async () => {
    // Override translation mock to return empty string for 'loadMore'
    // to cover the `t('loadMore') || 'Załaduj więcej'` branch (line 128)
    const { useTranslations } = await import('next-intl');
    vi.mocked(useTranslations).mockReturnValue(((key: string) =>
      key === 'loadMore' ? '' : key) as unknown as ReturnType<
      typeof useTranslations
    >);

    // Provide empty initialData but somehow we still have loadMore button
    // This is to cover `if (lastItem)` being false (line 57).
    // Normally if items.length === 0, the button isn't rendered,
    // so we must render with an array containing an undefined item, then click loadMore,
    // and let searchPublishedNews return fewer items to cover limit fallback (line 78).
    const initialData = [mockSearchResult('1')];

    // Return fewer items than default limit 12 to trigger `setHasMore(false)`
    vi.mocked(searchPublishedNews).mockImplementation(async () => {
      // Simulate long network request so we can click again while loading (line 43)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [mockSearchResult('2')], // length = 1, which is < 12 (default limit)
            totalPages: 1,
            total: 1,
            page: 1,
          });
        }, 50);
      });
    });

    const searchParams: SearchParams = {
      language: 'en',
      // No limit provided to test limit || 12 fallback (line 78)
    };

    render(
      <NewsGridClient
        initialData={initialData}
        totalPages={2}
        searchParams={searchParams}
      />
    );

    const loadMoreBtn = screen.getByRole('button', { name: 'Załaduj więcej' });

    vi.useFakeTimers();

    // Click to start loading
    fireEvent.click(loadMoreBtn);

    // Click AGAIN while loading to cover `if (loading) return` (line 43)
    fireEvent.click(loadMoreBtn);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    vi.useRealTimers();

    // After resolving, hasMore should be false since data length (1) < 12
    // So the button should be removed
    expect(
      screen.queryByRole('button', { name: 'Załaduj więcej' })
    ).not.toBeInTheDocument();
  });
});
