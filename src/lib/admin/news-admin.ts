import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient;

const snapshotInclude = {
  translations: true,
  tags: { select: { id: true } },
  photos: { include: { translations: true } },
} satisfies Prisma.NewsInclude;

export type NewsSnapshot = Prisma.NewsGetPayload<{
  include: typeof snapshotInclude;
}>;

/** Everything needed to restore an article from the trash. */
export function newsSnapshot(tx: Tx, id: string) {
  return tx.news.findUnique({ where: { id }, include: snapshotInclude });
}

/** Recreates a trashed article with its translations, photos and tags. */
export async function restoreNews(data: NewsSnapshot) {
  // Tags deleted in the meantime are skipped
  const tags = await prisma.tag.findMany({
    where: { id: { in: data.tags.map((t) => t.id) } },
    select: { id: true },
  });
  await prisma.news.create({
    data: {
      id: data.id,
      createdAt: data.createdAt,
      published: data.published,
      publishedAt: data.publishedAt,
      translations: {
        create: data.translations.map(({ languageCode, title, content }) => ({
          languageCode,
          title,
          content,
        })),
      },
      tags: { connect: tags },
      photos: {
        create: data.photos.map((photo) => ({
          id: photo.id,
          url: photo.url,
          displayOrder: photo.displayOrder,
          translations: {
            create: photo.translations.map(({ languageCode, alt }) => ({
              languageCode,
              alt,
            })),
          },
        })),
      },
    },
  });
}
