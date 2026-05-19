import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecentNewsServer from '../RecentNewsServer';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    news: {
      findMany: vi.fn(),
    },
  },
}));

// Use inferred type for Prisma result
type RecentArticle = Prisma.NewsGetPayload<{
  include: {
    tags: { include: { translations: true } };
    photos: true;
    translations: true;
  };
}>;

function mockArticle(id: string): RecentArticle {
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
        title: `Recent Article ${id}`,
        content: `Content ${id}`,
      },
    ],
  };
}

describe('RecentNewsServer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render an empty container if no news is found', async () => {
    vi.mocked(prisma.news.findMany).mockResolvedValue([]);
    const jsx = await RecentNewsServer({ locale: 'en' });
    const { container } = render(jsx);

    // It should render the wrapper div but it should be empty
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it('should render a NewsTile for each article returned', async () => {
    vi.mocked(prisma.news.findMany).mockResolvedValue([
      mockArticle('1'),
      mockArticle('2'),
      mockArticle('3'),
    ]);
    const jsx = await RecentNewsServer({ locale: 'en' });
    render(jsx);

    // NewsTile creates a link for each article
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });
});
