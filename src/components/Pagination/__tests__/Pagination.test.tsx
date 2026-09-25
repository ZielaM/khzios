import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pagination, { pageItems } from '../Pagination';

vi.mock('next-intl/server', () => ({
  getTranslations: vi
    .fn()
    .mockResolvedValue((key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key
    ),
}));

async function renderPagination(
  currentPage: number,
  totalPages: number,
  params: Record<string, string | undefined> = {}
) {
  const jsx = await Pagination({
    currentPage,
    totalPages,
    pathname: '/pl/aktualnosci',
    params,
  });
  return render(<>{jsx}</>);
}

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
  });

  it('shows the first, last and neighbouring pages with gaps', () => {
    expect(pageItems(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
  });

  it('fills a single missing page instead of showing a gap', () => {
    expect(pageItems(3, 10)).toEqual([1, 2, 3, 4, 'gap', 10]);
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', async () => {
    const { container } = await renderPagination(1, 1);
    expect(container.innerHTML).toBe('');
  });

  it('renders page links that keep the current filters', async () => {
    await renderPagination(2, 5, { query: 'krowy', tag: 'drób', page: '2' });

    expect(
      screen.getByRole('link', { name: 'page:{"page":3}' })
    ).toHaveAttribute(
      'href',
      '/pl/aktualnosci?query=krowy&tag=dr%C3%B3b&page=3'
    );
    // Page 1 has no page parameter at all
    expect(
      screen.getByRole('link', { name: 'page:{"page":1}' })
    ).toHaveAttribute('href', '/pl/aktualnosci?query=krowy&tag=dr%C3%B3b');
  });

  it('marks the current page', async () => {
    await renderPagination(2, 5);
    expect(
      screen.getByRole('link', { name: 'page:{"page":2}' })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('links to the previous and next pages', async () => {
    await renderPagination(3, 5);
    expect(screen.getByRole('link', { name: 'prev' })).toHaveAttribute(
      'href',
      '/pl/aktualnosci?page=2'
    );
    expect(screen.getByRole('link', { name: 'next' })).toHaveAttribute(
      'href',
      '/pl/aktualnosci?page=4'
    );
  });

  it('has no previous link on the first page and no next link on the last', async () => {
    await renderPagination(1, 2);
    expect(
      screen.queryByRole('link', { name: 'prev' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'next' })).toBeInTheDocument();
  });
});
