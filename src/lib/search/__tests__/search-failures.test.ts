import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { searchNews } from '../news';
import { searchPublications } from '../publications';

// Situations a real database cannot reproduce on demand
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    news: { findMany: vi.fn() },
    publication: { findMany: vi.fn() },
  },
}));

const raw = vi.mocked(prisma.$queryRaw);
beforeEach(() => vi.clearAllMocks());

describe.each([
  ['searchNews', searchNews, prisma.news],
  ['searchPublications', searchPublications, prisma.publication],
] as const)('%s', (_, search, model) => {
  it('shows an empty page instead of failing when the database errors', async () => {
    raw.mockRejectedValue(new Error('connection lost'));
    const result = await search({ language: 'pl', query: 'mleko', page: 2 });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('skips a match deleted between the search and loading its record', async () => {
    raw
      .mockResolvedValueOnce([
        { id: 'gone', languageCode: 'pl', title: 't', content: 'c', rank: 1 },
      ])
      // No count row at all is read as zero
      .mockResolvedValueOnce([]);
    vi.mocked(model.findMany).mockResolvedValue([]);
    const result = await search({ language: 'pl', query: 'mleko' });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
