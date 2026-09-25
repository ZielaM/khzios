/**
 * Published news listing and full-text search.
 *
 * Called from server components with values parsed from the URL, so results
 * are rendered on the server and every page of results has its own URL.
 */

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { validateSearchParams } from '@/lib/validation';
import { newsInclude, type NewsWithRelations } from '@/lib/news-queries';
import { createLogger } from '@/lib/logger';
import type { SearchParams } from '@/types/search-types';
import { emptyPage, type SearchPage } from './types';

const log = createLogger('search');

interface Highlight {
  title: string;
  content: string;
  languageCode: string;
}

export async function searchNews(
  params: SearchParams
): Promise<SearchPage<NewsWithRelations>> {
  const {
    safePage,
    safeLimit,
    safeQuery,
    safeTags,
    fallbackLanguages,
    dictionary,
    safeSortBy,
    safeDateFrom,
    safeDateBefore,
  } = validateSearchParams(params);

  try {
    const start = performance.now();
    const offset = (safePage - 1) * safeLimit;

    let newsIds: string[];
    let totalCount: number;
    const highlights = new Map<string, Highlight>();

    if (safeQuery) {
      // Full-text search runs in SQL. Each article matches in any language of
      // the fallback chain; DISTINCT ON keeps the best language per article so
      // its highlighted snippet is in the reader's language when possible.
      const tsQuery = Prisma.sql`websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})`;
      const langOrder = Prisma.sql`ARRAY[${Prisma.join(
        fallbackLanguages.map((l) => Prisma.sql`${l}::text`),
        ', '
      )}]`;

      const conditions = [
        Prisma.sql`(${Prisma.join(
          fallbackLanguages.map(
            (lang) =>
              Prisma.sql`nt."languageCode" = CAST(${lang} AS "LanguageCode")`
          ),
          ' OR '
        )})`,
        Prisma.sql`n.published = true`,
        Prisma.sql`nt."searchVector" @@ ${tsQuery}`,
      ];
      if (safeTags) {
        // A tag matches by its canonical name or any of its translations
        conditions.push(
          Prisma.sql`n.id IN (SELECT rel."A" FROM "_NewsToTag" rel JOIN "Tag" t ON t.id = rel."B" LEFT JOIN "TagTranslation" tt ON tt."tagId" = t.id WHERE ${Prisma.join(
            safeTags.map((t) => Prisma.sql`(t.name = ${t} OR tt.name = ${t})`),
            ' OR '
          )})`
        );
      }
      if (safeDateFrom) {
        conditions.push(Prisma.sql`n."publishedAt" >= ${safeDateFrom}`);
      }
      if (safeDateBefore) {
        conditions.push(Prisma.sql`n."publishedAt" < ${safeDateBefore}`);
      }
      const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
      const from = Prisma.sql`FROM "News" n JOIN "NewsTranslation" nt ON nt."newsId" = n.id`;
      const orderBy =
        safeSortBy === 'relevance'
          ? Prisma.sql`ORDER BY rank DESC, "publishedAt" DESC`
          : Prisma.sql`ORDER BY "publishedAt" DESC`;

      const [rows, countRows] = await Promise.all([
        prisma.$queryRaw<
          {
            id: string;
            languageCode: string;
            highlighted_title: string;
            highlighted_content: string;
          }[]
        >`WITH ranked AS (
            SELECT DISTINCT ON (n.id)
              n.id,
              n."publishedAt",
              nt."languageCode",
              ts_headline(${dictionary}::regconfig, nt.title, ${tsQuery}, 'StartSel=<mark>, StopSel=</mark>, HighlightAll=true') AS highlighted_title,
              ts_headline(${dictionary}::regconfig, nt.content, ${tsQuery}, 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS highlighted_content,
              ts_rank(nt."searchVector", ${tsQuery}) AS rank
            ${from}
            ${where}
            ORDER BY n.id, array_position(${langOrder}, nt."languageCode"::text), ts_rank(nt."searchVector", ${tsQuery}) DESC
          )
          SELECT * FROM ranked ${orderBy}
          LIMIT ${safeLimit} OFFSET ${offset}`,
        prisma.$queryRaw<
          { total: number }[]
        >`SELECT CAST(COUNT(DISTINCT n.id) AS INTEGER) AS total ${from} ${where}`,
      ]);

      newsIds = rows.map((r) => r.id);
      totalCount = countRows[0]?.total ?? 0;
      for (const r of rows) {
        highlights.set(r.id, {
          title: r.highlighted_title,
          content: r.highlighted_content,
          languageCode: r.languageCode,
        });
      }
    } else {
      const where: Prisma.NewsWhereInput = { published: true };
      if (safeTags) {
        where.tags = {
          some: {
            OR: safeTags.flatMap((t) => [
              { name: t },
              { translations: { some: { name: t } } },
            ]),
          },
        };
      }
      if (safeDateFrom || safeDateBefore) {
        where.publishedAt = {
          ...(safeDateFrom && { gte: safeDateFrom }),
          ...(safeDateBefore && { lt: safeDateBefore }),
        };
      }

      const [rows, count] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
          skip: offset,
          take: safeLimit,
          select: { id: true },
        }),
        prisma.news.count({ where }),
      ]);
      newsIds = rows.map((r) => r.id);
      totalCount = count;
    }

    if (newsIds.length === 0) {
      return { ...emptyPage(safePage), total: totalCount };
    }

    const items = await prisma.news.findMany({
      where: { id: { in: newsIds } },
      include: newsInclude,
    });
    const byId = new Map(items.map((n) => [n.id, n]));

    // Restore the ranking order and swap in the highlighted snippets
    const data = newsIds.flatMap((id) => {
      const item = byId.get(id);
      if (!item) return [];
      const highlight = highlights.get(id);
      if (!highlight) return [item];
      return [
        {
          ...item,
          translations: item.translations.map((tr) =>
            tr.languageCode === highlight.languageCode
              ? { ...tr, title: highlight.title, content: highlight.content }
              : tr
          ),
        },
      ];
    });

    log.info(
      {
        hasQuery: !!safeQuery,
        hasTags: !!safeTags,
        page: safePage,
        resultCount: data.length,
        totalCount,
        durationMs: Math.round(performance.now() - start),
      },
      'News search completed'
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
      'News search failed'
    );
    return emptyPage(safePage);
  }
}
