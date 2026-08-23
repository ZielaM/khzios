import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PublicationsListServer from '../PublicationsListServer';
import { searchPublications } from '@/actions/search-publications';

// Mock server actions
vi.mock('@/actions/search-publications', () => ({
  searchPublications: vi.fn(),
}));

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

// Mock Pagination
vi.mock('@/components/Pagination', () => ({
  default: ({
    currentPage,
    totalPages,
  }: {
    currentPage: number;
    totalPages: number;
  }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
    </div>
  ),
}));

describe('PublicationsListServer', () => {
  it('renders no results message when data is empty', async () => {
    vi.mocked(searchPublications).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
    });

    // Call the async function to get the JSX
    const jsx = await PublicationsListServer({
      locale: 'en',
      page: 1,
    });

    render(jsx);
    expect(screen.getByText('noResults')).toBeInTheDocument();
  });

  it('renders a list of publications', async () => {
    vi.mocked(searchPublications).mockResolvedValue({
      data: [
        {
          id: 'pub-1',
          year: 2023,
          authors: 'John Doe',
          journal: 'Nature',
          doi: '10.1234/5678',
          translations: [{ languageCode: 'en', title: 'Amazing Paper' }],
          team: {
            slug: 'team-a',
            translations: [{ languageCode: 'en', name: 'Team A' }],
          },
        } as unknown as NonNullable<
          Awaited<ReturnType<typeof searchPublications>>['data']
        >[0],
      ],
      total: 1,
      totalPages: 1,
      page: 1,
    });

    const jsx = await PublicationsListServer({
      locale: 'en',
      page: 1,
    });

    render(jsx);

    expect(screen.getByText('Amazing Paper')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Nature')).toBeInTheDocument();

    // External DOI link
    const doiLink = screen.getByRole('link', { name: /DOI/i });
    expect(doiLink).toHaveAttribute('href', 'https://doi.org/10.1234/5678');

    // Team link
    const teamLink = screen.getByRole('link', { name: /Team A/i });
    expect(teamLink).toHaveAttribute('href', '/about-us/structure/team-a');
  });

  it('requests sort by relevance when query is provided', async () => {
    vi.mocked(searchPublications).mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
    });

    const jsx = await PublicationsListServer({
      query: 'test query',
      locale: 'en',
      page: 1,
    });
    render(jsx);

    expect(searchPublications).toHaveBeenCalledWith({
      query: 'test query',
      language: 'en',
      page: 1,
      sortBy: 'relevance',
    });
  });

  it('skips rendering publication if missing translation for locale', async () => {
    vi.mocked(searchPublications).mockResolvedValue({
      data: [
        {
          id: 'pub-no-trans',
          year: 2023,
          authors: 'John Doe',
          journal: 'Nature',
          translations: [], // No translations
        } as unknown as NonNullable<
          Awaited<ReturnType<typeof searchPublications>>['data']
        >[0],
      ],
      total: 1,
      totalPages: 1,
      page: 1,
    });

    const jsx = await PublicationsListServer({
      locale: 'en',
      page: 1,
    });

    const { container } = render(jsx);
    expect(container.querySelector('.publicationItem')).not.toBeInTheDocument();
  });

  it('renders publication without team and handles http DOI', async () => {
    vi.mocked(searchPublications).mockResolvedValue({
      data: [
        {
          id: 'pub-2',
          year: 2024,
          authors: 'Jane Smith',
          journal: 'Science',
          doi: 'https://doi.org/10.9999/8888',
          translations: [{ languageCode: 'en', title: 'HTTP DOI Paper' }],
          // No team
        } as unknown as NonNullable<
          Awaited<ReturnType<typeof searchPublications>>['data']
        >[0],
      ],
      total: 1,
      totalPages: 1,
      page: 1,
    });

    const jsx = await PublicationsListServer({
      locale: 'en',
      page: 1,
    });

    render(jsx);

    expect(screen.getByText('HTTP DOI Paper')).toBeInTheDocument();

    const doiLink = screen.getByRole('link', { name: /DOI/i });
    expect(doiLink).toHaveAttribute('href', 'https://doi.org/10.9999/8888');

    // Should not render team link
    const links = screen.queryAllByRole('link');
    expect(links.length).toBe(1); // Only DOI link
  });

  it('renders publication with team but missing team translation', async () => {
    vi.mocked(searchPublications).mockResolvedValue({
      data: [
        {
          id: 'pub-3',
          year: 2024,
          authors: 'Jane Smith',
          journal: 'Science',
          translations: [{ languageCode: 'en', title: 'Team No Trans' }],
          team: {
            slug: 'team-no-trans',
            translations: [], // Missing team translation
          },
        } as unknown as NonNullable<
          Awaited<ReturnType<typeof searchPublications>>['data']
        >[0],
      ],
      total: 1,
      totalPages: 1,
      page: 1,
    });

    const jsx = await PublicationsListServer({
      locale: 'en',
      page: 1,
    });

    render(jsx);

    expect(screen.getByText('Team No Trans')).toBeInTheDocument();
    // team link should not be rendered
    const links = screen.queryAllByRole('link');
    expect(links.length).toBe(0); // No DOI, no team
  });
});
