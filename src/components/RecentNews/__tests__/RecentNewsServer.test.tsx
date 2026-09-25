import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecentNewsServer from '../RecentNewsServer';
import { getRecentNews } from '@/lib/news-queries';
import { makeNews } from '@/test/fixtures';

vi.mock('@/lib/news-queries', () => ({
  getRecentNews: vi.fn(),
}));

describe('RecentNewsServer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render an empty container if no news is found', async () => {
    vi.mocked(getRecentNews).mockResolvedValue([]);
    const jsx = await RecentNewsServer({ locale: 'en' });
    const { container } = render(jsx);

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should render a NewsTile for each of the three latest articles', async () => {
    vi.mocked(getRecentNews).mockResolvedValue([
      makeNews('1'),
      makeNews('2'),
      makeNews('3'),
    ]);
    const jsx = await RecentNewsServer({ locale: 'en' });
    render(jsx);

    expect(getRecentNews).toHaveBeenCalledWith(3);
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});
