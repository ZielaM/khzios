/**
 * Publication listing and full-text search (title, authors and journal).
 */

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { validateSearchParams } from '@/lib/validation';
import { createLogger } from '@/lib/logger';
import type { SearchParams } from '@/types/search-types';
import { languageQueries } from './full-text';
import { emptyPage, type SearchPage } from './types';

const log = createLogger('search-publications');

const publicationInclude = {
  teams: {
    include: { team: { include: { translations: true } } },
    orderBy: { team: { displayOrder: 'asc' } },
  },
  translations: true,
} satisfies Prisma.PublicationInclude;

export type PublicationWithRelations = Prisma.PublicationGetPayload<{
  include: typeof publicationInclude;
}>;

export async function searchPublications(
  params: SearchParams
): Promise<SearchPage<PublicationWithRelations>> {
  const { safePage, safeLimit, safeQuery, fallbackLanguages } =
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
      const queries = languageQueries(fallbackLanguages, safeQuery);
      const from = Prisma.sql`FROM queries q
        JOIN "PublicationTranslation" pt ON pt."languageCode" = q.lang AND pt."searchVector" @@ q.query
        JOIN "Publication" p ON p.id = pt."publicationId"`;

      const [rows, countRows] = await Promise.all([
        prisma.$queryRaw<
          { id: string; languageCode: string; highlighted_title: string }[]
        >`WITH ${queries}, ranked AS (
            SELECT DISTINCT ON (p.id)
              p.id,
              p.year,
              pt."languageCode",
              pt.title,
              q.lang,
              q.query,
              ts_rank(pt."searchVector", q.query) AS rank
            ${from}
            ORDER BY p.id, q.position
          ), page AS (
            SELECT * FROM ranked ORDER BY rank DESC, year DESC
            LIMIT ${safeLimit} OFFSET ${offset}
          )
          -- Highlighting runs the dictionaries over whole texts: only for the page shown
          SELECT
            id,
            "languageCode",
            ts_headline(search_config(lang), title, query, 'StartSel=<mark>, StopSel=</mark>, HighlightAll=true') AS highlighted_title
          FROM page ORDER BY rank DESC, year DESC`,
        prisma.$queryRaw<
          { total: number }[]
        >`WITH ${queries} SELECT CAST(COUNT(DISTINCT p.id) AS INTEGER) AS total ${from}`,
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
