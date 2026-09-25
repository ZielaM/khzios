/**
 * Publication listing and full-text search (title, authors and journal).
 */

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { validateSearchParams } from '@/lib/validation';
import { createLogger } from '@/lib/logger';
import type { SearchParams } from '@/types/search-types';
import { emptyPage, type SearchPage } from './types';

const log = createLogger('search-publications');

const publicationInclude = {
  team: { include: { translations: true } },
  translations: true,
} satisfies Prisma.PublicationInclude;

export type PublicationWithRelations = Prisma.PublicationGetPayload<{
  include: typeof publicationInclude;
}>;

export async function searchPublications(
  params: SearchParams
): Promise<SearchPage<PublicationWithRelations>> {
  const { safePage, safeLimit, safeQuery, fallbackLanguages, dictionary } =
    validateSearchParams(params);

  try {
    const start = performance.now();
    const offset = (safePage - 1) * safeLimit;

    let ids: string[];
    let totalCount: number;
    const highlights = new Map<
      string,
      { title: string; languageCode: string }
    >();

    if (safeQuery) {
      const tsQuery = Prisma.sql`websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})`;
      const langOrder = Prisma.sql`ARRAY[${Prisma.join(
        fallbackLanguages.map((l) => Prisma.sql`${l}::text`),
        ', '
      )}]`;
      const where = Prisma.sql`WHERE (${Prisma.join(
        fallbackLanguages.map(
          (lang) =>
            Prisma.sql`pt."languageCode" = CAST(${lang} AS "LanguageCode")`
        ),
        ' OR '
      )}) AND pt."searchVector" @@ ${tsQuery}`;
      const from = Prisma.sql`FROM "Publication" p JOIN "PublicationTranslation" pt ON pt."publicationId" = p.id`;

      const [rows, countRows] = await Promise.all([
        prisma.$queryRaw<
          { id: string; languageCode: string; highlighted_title: string }[]
        >`WITH ranked AS (
            SELECT DISTINCT ON (p.id)
              p.id,
              p.year,
              pt."languageCode",
              ts_headline(${dictionary}::regconfig, pt.title, ${tsQuery}, 'StartSel=<mark>, StopSel=</mark>, HighlightAll=true') AS highlighted_title,
              ts_rank(pt."searchVector", ${tsQuery}) AS rank
            ${from}
            ${where}
            ORDER BY p.id, array_position(${langOrder}, pt."languageCode"::text), ts_rank(pt."searchVector", ${tsQuery}) DESC
          )
          SELECT * FROM ranked ORDER BY rank DESC, year DESC
          LIMIT ${safeLimit} OFFSET ${offset}`,
        prisma.$queryRaw<
          { total: number }[]
        >`SELECT CAST(COUNT(DISTINCT p.id) AS INTEGER) AS total ${from} ${where}`,
      ]);

      ids = rows.map((r) => r.id);
      totalCount = countRows[0]?.total ?? 0;
      for (const r of rows) {
        highlights.set(r.id, {
          title: r.highlighted_title,
          languageCode: r.languageCode,
        });
      }
    } else {
      const [rows, count] = await Promise.all([
        prisma.publication.findMany({
          orderBy: [{ year: 'desc' }, { id: 'asc' }],
          skip: offset,
          take: safeLimit,
          select: { id: true },
        }),
        prisma.publication.count(),
      ]);
      ids = rows.map((r) => r.id);
      totalCount = count;
    }

    if (ids.length === 0) {
      return { ...emptyPage(safePage), total: totalCount };
    }

    const items = await prisma.publication.findMany({
      where: { id: { in: ids } },
      include: publicationInclude,
    });
    const byId = new Map(items.map((p) => [p.id, p]));

    const data = ids.flatMap((id) => {
      const item = byId.get(id);
      if (!item) return [];
      const highlight = highlights.get(id);
      if (!highlight) return [item];
      return [
        {
          ...item,
          translations: item.translations.map((tr) =>
            tr.languageCode === highlight.languageCode
              ? { ...tr, title: highlight.title }
              : tr
          ),
        },
      ];
    });

    log.info(
      {
        hasQuery: !!safeQuery,
        page: safePage,
        resultCount: data.length,
        totalCount,
        durationMs: Math.round(performance.now() - start),
      },
      'Publications search completed'
    );

    return {
      data,
      total: totalCount,
      page: safePage,
      totalPages: Math.ceil(totalCount / safeLimit),
    };
  } catch (err) {
    log.error(
      { err, hasQuery: !!safeQuery, page: safePage },
      'Publications search failed'
    );
    return emptyPage(safePage);
  }
}
