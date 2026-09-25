/**
 * Prisma queries for news articles.
 *
 * Per-request functions are wrapped in React's cache() so generateMetadata()
 * and the page component share one database round trip.
 */

import { cache } from 'react';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('news-queries');

/** Relations needed to render an article card or page. */
export const newsInclude = {
  translations: true,
  tags: { include: { translations: true } },
  // The first photo is the article's main image, so the order must be stable
  photos: { include: { translations: true }, orderBy: { id: 'asc' } },
} satisfies Prisma.NewsInclude;

export type NewsWithRelations = Prisma.NewsGetPayload<{
  include: typeof newsInclude;
}>;

export type NewsPhoto = NewsWithRelations['photos'][number];

/** A single published article, or null when it does not exist or is a draft. */
export const getNewsById = cache(async (id: string) => {
  const news = await prisma.news.findUnique({
    where: { id, published: true },
    include: newsInclude,
  });

  if (!news) {
    log.warn({ newsId: id }, 'News article not found or unpublished');
  }

  return news;
});

/** The most recently published articles. */
export async function getRecentNews(limit = 3) {
  return prisma.news.findMany({
    where: { published: true },
    include: newsInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

/**
 * Latest articles sharing at least one tag with the current one, or simply
 * the latest articles when it has no tags.
 */
export const getRelatedNews = cache(
  async (newsId: string, tagIds: string[], limit: number = 3) => {
    return prisma.news.findMany({
      where: {
        id: { not: newsId },
        published: true,
        ...(tagIds.length > 0 && { tags: { some: { id: { in: tagIds } } } }),
      },
      include: newsInclude,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }
);

/** Every published article with its photos, for sitemap.xml. */
export async function getPublishedNewsForSitemap() {
  return prisma.news.findMany({
    where: { published: true },
    select: {
      id: true,
      updatedAt: true,
      photos: { select: { url: true }, orderBy: { id: 'asc' } },
    },
    orderBy: { publishedAt: 'desc' },
  });
}
