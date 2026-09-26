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

  it('renders nothing when there is no news', async () => {
    vi.mocked(getRecentNews).mockResolvedValue([]);
    const jsx = await RecentNewsServer({ locale: 'en' });

    expect(jsx).toBeNull();
  });

  it('shows the latest article as the lead and the next four as a list', async () => {
    vi.mocked(getRecentNews).mockResolvedValue(
      ['1', '2', '3', '4', '5'].map((id) => makeNews(id))
    );
    const jsx = await RecentNewsServer({ locale: 'en' });
    render(jsx!);

    expect(getRecentNews).toHaveBeenCalledWith(5);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getAllByRole('link')).toHaveLength(5);
  });
});
