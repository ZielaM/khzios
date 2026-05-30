import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getNewsById, getRelatedNews } from '../news-queries';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    news: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock react cache to just return the function
vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

describe('news-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNewsById', () => {
    it('calls prisma.news.findUnique with correct args', async () => {
      const mockNews = { id: '1', title: 'Test' };
      vi.mocked(prisma.news.findUnique).mockResolvedValue(
        mockNews as unknown as Awaited<
          ReturnType<typeof prisma.news.findUnique>
        >
      );

      const result = await getNewsById('1');

      expect(prisma.news.findUnique).toHaveBeenCalledWith({
        where: { id: '1', published: true },
        include: {
          translations: true,
          tags: {
            include: {
              translations: true,
            },
          },
          photos: true,
        },
      });
      expect(result).toEqual(mockNews);
    });
  });

  describe('getRelatedNews', () => {
    it('falls back to recent articles if tagIds array is empty', async () => {
      const mockNewsList = [{ id: '2' }, { id: '3' }];
      vi.mocked(prisma.news.findMany).mockResolvedValue(
        mockNewsList as unknown as Awaited<
          ReturnType<typeof prisma.news.findMany>
        >
      );

      const result = await getRelatedNews('1', [], 2);

      expect(prisma.news.findMany).toHaveBeenCalledWith({
        where: {
          id: { not: '1' },
          published: true,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 2,
      });
      expect(result).toEqual(mockNewsList);
    });

    it('queries by tagIds when tags are provided', async () => {
      const mockNewsList = [{ id: '4' }];
      vi.mocked(prisma.news.findMany).mockResolvedValue(
        mockNewsList as unknown as NonNullable<
          Awaited<ReturnType<typeof getRelatedNews>>
        >
      );

      const result = await getRelatedNews('1', ['tag1'], 3);

      expect(prisma.news.findMany).toHaveBeenCalledWith({
        where: {
          id: { not: '1' },
          published: true,
          tags: {
            some: {
              id: { in: ['tag1'] },
            },
          },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
      expect(result).toEqual(mockNewsList);
    });
  });
});
