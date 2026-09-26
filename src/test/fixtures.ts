/**
 * Test data factories shared by unit tests.
 */

import type { NewsPhoto, NewsWithRelations } from '@/lib/news-queries';

export function makePhoto(
  id: string,
  url: string,
  alt?: { pl?: string; en?: string }
): NewsPhoto {
  return {
    id,
    url,
    newsId: 'news',
    displayOrder: 0,
    translations: Object.entries(alt ?? {}).map(([languageCode, text]) => ({
      photoId: id,
      languageCode: languageCode as 'pl' | 'en',
      alt: text as string,
    })),
  };
}

export function makeNews(
  id = 'news-1',
  overrides: Partial<NewsWithRelations> = {}
): NewsWithRelations {
  const date = new Date('2026-01-01T10:00:00Z');
  return {
    id,
    createdAt: date,
    updatedAt: date,
    publishedAt: date,
    published: true,
    tags: [],
    photos: [],
    translations: [
      {
        newsId: id,
        languageCode: 'en',
        title: `Article ${id}`,
        content: `Content ${id}`,
      },
    ],
    ...overrides,
  };
}
