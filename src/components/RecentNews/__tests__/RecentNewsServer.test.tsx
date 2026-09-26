import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecentNewsServer from '../RecentNewsServer';
import { getRecentNews } from '@/lib/news-queries';
import { makeNews } from '@/test/fixtures';

vi.mock('@/lib/news-queries', () => ({
  getRecentNews: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

describe('RecentNewsServer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('says so when there is no news', async () => {
    vi.mocked(getRecentNews).mockResolvedValue([]);
    render(await RecentNewsServer({ locale: 'en' }));

    expect(screen.getByText('noNews')).toBeInTheDocument();
  });

  it('shows the latest article as the lead and the next four as a list', async () => {
    vi.mocked(getRecentNews).mockResolvedValue(
      ['1', '2', '3', '4', '5'].map((id) => makeNews(id))
    );
    const jsx = await RecentNewsServer({ locale: 'en' });
    render(jsx);

    expect(getRecentNews).toHaveBeenCalledWith(5);
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getAllByRole('link')).toHaveLength(5);
  });
});
