/**
 * Cached Prisma queries for news articles.
 *
 * Wrapping queries in React's cache() ensures that when Next.js calls
 * both generateMetadata() and the page component in the same request,
 * the database is only hit ONCE instead of twice.
 */

import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Fetches a single published news article by ID with all relations.
 * Result is cached per-request via React.cache().
 */
export const getNewsById = cache(async (id: string) => {
  return prisma.news.findUnique({
    where: { id, published: true },
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
});

/**
 * Fetches related news articles that share at least one tag with
 * the given article. Excludes the current article from results.
 *
 * @param newsId - The current article ID to exclude
 * @param tagIds - Tag IDs to match against
 * @param limit - Maximum number of related articles to return
 */
export const getRelatedNews = cache(
  async (newsId: string, tagIds: string[], limit: number = 3) => {
    if (tagIds.length === 0) {
      // If no tags, fall back to the most recent articles
      return prisma.news.findMany({
        where: {
          id: { not: newsId },
          published: true,
        },
        include: {
          translations: true,
          tags: { include: { translations: true } },
          photos: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    return prisma.news.findMany({
      where: {
        id: { not: newsId },
        published: true,
        tags: {
          some: {
            id: { in: tagIds },
          },
        },
      },
      include: {
        translations: true,
        tags: { include: { translations: true } },
        photos: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
);
