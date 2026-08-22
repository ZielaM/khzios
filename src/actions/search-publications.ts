'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { validateSearchParams } from '@/lib/validation';
import { SearchParams } from '@/types/search-types';

export async function searchPublications(params: SearchParams) {
  const { safePage, safeLimit, safeQuery, fallbackLanguages, dictionary } =
    validateSearchParams(params);

  try {
    const offset = (safePage - 1) * safeLimit;
    let pubIds: string[] = [];
    const highlightedMap: Record<
      string,
      { title: string; languageCode: string }
    > = {};
    let totalCount = 0;

    if (safeQuery) {
      const sqlParts = [];
      const countParts = [];

      const langTextArray = fallbackLanguages.map(
        (l) => Prisma.sql`${l}::text`
      );
      const langArray = Prisma.sql`ARRAY[${Prisma.join(langTextArray, ', ')}]`;

      const cteSelectPart = Prisma.sql`WITH RankedMatches AS ( SELECT DISTINCT ON (p.id) p.id, pt."languageCode", ts_headline(${dictionary}::regconfig, pt.title, websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery}), 'StartSel=<mark>, StopSel=</mark>, MaxFragments=0') AS highlighted_title, ts_rank(pt."searchVector", websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})) AS rank, p.year`;
      const selectCountPart = Prisma.sql`SELECT CAST(COUNT(DISTINCT p.id) AS INTEGER) as total`;

      const fromPart = Prisma.sql`FROM "Publication" p JOIN "PublicationTranslation" pt ON pt."publicationId" = p.id`;

      sqlParts.push(cteSelectPart, fromPart);
      countParts.push(selectCountPart, fromPart);

      const whereParts = [];
      const langConditions = fallbackLanguages.map(
        (lang) =>
          Prisma.sql`pt."languageCode" = CAST(${lang} AS "LanguageCode")`
      );
      whereParts.push(Prisma.sql`(${Prisma.join(langConditions, ' OR ')})`);

      // Full-text search match condition
      whereParts.push(
        Prisma.sql`pt."searchVector" @@ websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})`
      );

      const whereClause = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`;
      sqlParts.push(whereClause);
      countParts.push(whereClause);

      // Order By in CTE for DISTINCT ON
      const cteOrderBy = Prisma.sql`ORDER BY p.id, array_position(${langArray}, CAST(pt."languageCode" AS text)) ASC, ts_rank(pt."searchVector", websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})) DESC )`;
      sqlParts.push(cteOrderBy);

      // Main query
      const mainSelect = Prisma.sql`SELECT * FROM RankedMatches`;
      sqlParts.push(mainSelect);

      // Order by relevance and year
      const orderBy = Prisma.sql`ORDER BY rank DESC, year DESC`;
      sqlParts.push(orderBy);
      sqlParts.push(Prisma.sql`LIMIT ${safeLimit} OFFSET ${offset}`);

      const [rawResults, rawCount] = await Promise.all([
        prisma.$queryRaw<
          {
            id: string;
            languageCode: string;
            highlighted_title: string;
            rank: number;
          }[]
        >(Prisma.join(sqlParts, ' ')),
        prisma.$queryRaw<{ total: number }[]>(Prisma.join(countParts, ' ')),
      ]);

      pubIds = rawResults.map((r) => r.id);
      totalCount = rawCount[0]?.total || 0;

      for (const r of rawResults) {
        highlightedMap[r.id] = {
          title: r.highlighted_title,
          languageCode: r.languageCode,
        };
      }
    } else {
      // Pure Prisma for empty query, sorted by date (year)
      const [pubData, count] = await Promise.all([
        prisma.publication.findMany({
          orderBy: { year: 'desc' },
          skip: offset,
          take: safeLimit,
          select: { id: true },
        }),
        prisma.publication.count(),
      ]);

      pubIds = pubData.map((p) => p.id);
      totalCount = count;
    }

    if (pubIds.length === 0) {
      return { data: [], total: 0, page: safePage, totalPages: 0 };
    }

    // Fetch full data with relations
    const publications = await prisma.publication.findMany({
      where: { id: { in: pubIds } },
      include: {
        team: { include: { translations: true } },
        translations: true,
      },
    });

    // Map back into correctly sorted order
    const pubMap = new Map(publications.map((p) => [p.id, p]));
    const sortedPublications = pubIds.map((id) => {
      const item = pubMap.get(id)!;
      if (highlightedMap[id]) {
        const tr = item.translations.find(
          (t) => t.languageCode === highlightedMap[id].languageCode
        );
        if (tr) {
          tr.title = highlightedMap[id].title;
        }
      }
      return item;
    });

    return {
      data: sortedPublications,
      total: totalCount,
      page: safePage,
      totalPages: Math.ceil(totalCount / safeLimit),
    };
  } catch (error) {
    console.error('Search Publications error:', error);
    return { data: [], total: 0, page: safePage ?? 1, totalPages: 0 };
  }
}
