import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NewsGridServer from '../NewsGridServer';
import { searchNews } from '@/lib/search/news';
import { makeNews } from '@/test/fixtures';

vi.mock('@/lib/search/news', () => ({
  searchNews: vi.fn(),
}));

// Pagination is an async server component with its own tests
vi.mock('@/components/Pagination', () => ({
  default: ({ totalPages }: { totalPages: number }) =>
    totalPages > 1 ? <nav aria-label="pagination" /> : null,
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

const baseProps = {
  locale: 'en' as const,
  pathname: '/en/news',
  page: 1,
  sortBy: 'date' as const,
};

describe('NewsGridServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the URL parameters to the search', async () => {
    vi.mocked(searchNews).mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      totalPages: 0,
    });

    await NewsGridServer({
      ...baseProps,
      page: 2,
      query: 'cows',
      tag: 'poultry',
      dateFrom: '2026-01-01',
      dateTo: '2026-02-01',
    });

    expect(searchNews).toHaveBeenCalledWith({
      query: 'cows',
      language: 'en',
      tag: 'poultry',
      page: 2,
      sortBy: 'date',
      dateFrom: '2026-01-01',
      dateTo: '2026-02-01',
    });
  });

  it('renders a tile per result and pagination links', async () => {
    vi.mocked(searchNews).mockResolvedValue({
      data: [makeNews('1'), makeNews('2')],
      total: 30,
      page: 1,
      totalPages: 3,
    });

    render(await NewsGridServer(baseProps));

    expect(screen.getAllByTestId('news-tile')).toHaveLength(2);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows an empty state without pagination when nothing matches', async () => {
    vi.mocked(searchNews).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    render(await NewsGridServer(baseProps));

    expect(screen.getByText('noResults')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
