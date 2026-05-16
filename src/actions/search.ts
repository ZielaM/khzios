'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { FALLBACK_CHAIN } from '@/lib/translations';

export type SearchParams = {
  query?: string;
  language: 'pl' | 'en' | 'uk' | 'ru';
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'relevance';
};

export async function searchPublishedNews({
  query,
  language,
  tag,
  page = 1,
  limit = 12,
  sortBy = 'date',
}: SearchParams) {
  // Input validation
  const safePage = Math.min(1000, Math.max(1, Math.floor(page))); // Max 1000 pages to prevent extreme OFFSET
  const safeLimit = Math.min(60, Math.max(1, Math.floor(limit)));
  const safeQuery = query ? query.trim().substring(0, 256) : undefined;
  const safeTag = tag ? tag.trim().substring(0, 256) : undefined;

  const allowedLanguages = ['pl', 'en', 'uk', 'ru'];
  const safeLanguage = allowedLanguages.includes(language) ? language : 'en';

  // Fallback languages for a given locale (e.g. uk -> ['uk', 'en', 'pl'])
  const fallbackLanguages = FALLBACK_CHAIN[safeLanguage] ?? [
    safeLanguage,
    'en',
    'pl',
  ];

  const dictionary = (() => {
    switch (safeLanguage) {
      case 'en':
        return 'english';
      case 'ru':
        return 'russian';
      default:
        return 'simple';
    }
  })();

  try {
    const offset = (safePage - 1) * safeLimit;

    // We will build the where conditions for Prisma to get IDs
    // Since FTS uses raw sql, we'll fetch IDs via raw sql if query is present, otherwise pure Prisma

    let newsIds: string[] = [];
    const highlightedMap: Record<
      string,
      { title: string; content: string; languageCode: string }
    > = {};
    let totalCount = 0;

    if (safeQuery) {
      // 1. Raw SQL for Full Text Search to get matching IDs, highlighting, and count
      // Search in all languages within the fallback chain, prioritizing hits
      // in the user's preferred language
      const sqlParts = [];
      const countParts = [];

      const langTextArray = fallbackLanguages.map(
        (l) => Prisma.sql`${l}::text`
      );
      const langArray = Prisma.sql`ARRAY[${Prisma.join(langTextArray, ', ')}]`;

      const cteSelectPart = Prisma.sql`WITH RankedMatches AS ( SELECT DISTINCT ON (n.id) n.id, nt."languageCode", ts_headline(${dictionary}::regconfig, nt.title, websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery}), 'StartSel=<mark>, StopSel=</mark>, MaxFragments=0') AS highlighted_title, ts_headline(${dictionary}::regconfig, nt.content, websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery}), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS highlighted_content, ts_rank(to_tsvector(${dictionary}::regconfig, nt.title || ' ' || nt.content), websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})) AS rank, n."createdAt"`;
      const selectCountPart = Prisma.sql`SELECT CAST(COUNT(DISTINCT n.id) AS INTEGER) as total`;

      const fromPart = Prisma.sql`FROM "News" n JOIN "NewsTranslation" nt ON nt."newsId" = n.id`;

      sqlParts.push(cteSelectPart, fromPart);
      countParts.push(selectCountPart, fromPart);

      const whereParts = [];
      // Search in translations from all languages in the fallback chain
      const langConditions = fallbackLanguages.map(
        (lang) =>
          Prisma.sql`nt."languageCode" = CAST(${lang} AS "LanguageCode")`
      );
      whereParts.push(Prisma.sql`(${Prisma.join(langConditions, ' OR ')})`);
      whereParts.push(Prisma.sql`n.published = true`);
      whereParts.push(
        Prisma.sql`to_tsvector(${dictionary}::regconfig, nt.title || ' ' || nt.content) @@ websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})`
      );

      if (safeTag) {
        // Split tags by comma and filter empty
        const tags = safeTag
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        if (tags.length > 0) {
          // Find news IDs that have ANY of these tags (in any language translation or native)
          const tagConditions = tags.map(
            (t) => Prisma.sql`t.name = ${t} OR tt.name = ${t}`
          );
          whereParts.push(
            Prisma.sql`n.id IN (SELECT "A" FROM "_NewsToTag" rel JOIN "Tag" t ON t.id = rel."B" LEFT JOIN "TagTranslation" tt ON tt."tagId" = t.id WHERE ${Prisma.join(tagConditions, ' OR ')})`
          );
        }
      }

      const whereClause = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`;
      sqlParts.push(whereClause);
      countParts.push(whereClause);

      // Order By in the CTE to satisfy DISTINCT ON, deduplicating by best fallback translation first, then rank
      const cteOrderBy = Prisma.sql`ORDER BY n.id, array_position(${langArray}, CAST(nt."languageCode" AS text)) ASC, ts_rank(to_tsvector(${dictionary}::regconfig, nt.title || ' ' || nt.content), websearch_to_tsquery(${dictionary}::regconfig, ${safeQuery})) DESC )`;
      sqlParts.push(cteOrderBy);

      // Main query selecting from CTE and paginating properly
      const mainSelect = Prisma.sql`SELECT * FROM RankedMatches`;
      sqlParts.push(mainSelect);

      const orderBy =
        sortBy === 'relevance'
          ? Prisma.sql`ORDER BY rank DESC, "createdAt" DESC`
          : Prisma.sql`ORDER BY "createdAt" DESC`;

      sqlParts.push(orderBy);
      sqlParts.push(Prisma.sql`LIMIT ${safeLimit} OFFSET ${offset}`);

      const [rawResults, rawCount] = await Promise.all([
        prisma.$queryRaw<
          {
            id: string;
            languageCode: string;
            highlighted_title: string;
            highlighted_content: string;
            rank: number;
          }[]
        >(Prisma.join(sqlParts, ' ')),
        prisma.$queryRaw<{ total: number }[]>(Prisma.join(countParts, ' ')),
      ]);

      newsIds = rawResults.map((r) => r.id);
      totalCount = rawCount[0]?.total || 0;

      for (const r of rawResults) {
        highlightedMap[r.id] = {
          title: r.highlighted_title,
          content: r.highlighted_content,
          languageCode: r.languageCode,
        };
      }
    } else {
      // 2. Pure Prisma for normal filtering
      // Show all published news — translation fallback is handled by NewsTile
      const whereCondition: Prisma.NewsWhereInput = {
        published: true,
      };

      if (safeTag) {
        const tags = safeTag
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        if (tags.length > 0) {
          whereCondition.tags = {
            some: {
              OR: tags.flatMap((t) => [
                { name: t },
                { translations: { some: { name: t } } },
              ]),
            },
          };
        }
      }

      const [newsData, count] = await Promise.all([
        prisma.news.findMany({
          where: whereCondition,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: safeLimit,
          select: { id: true },
        }),
        prisma.news.count({ where: whereCondition }),
      ]);

      newsIds = newsData.map((n) => n.id);
      totalCount = count;
    }

    if (newsIds.length === 0) {
      return { data: [], total: 0, page: safePage, totalPages: 0 };
    }

    // 3. Fetch full data for the fetched IDs
    const newsItems = await prisma.news.findMany({
      where: { id: { in: newsIds } },
      include: {
        tags: { include: { translations: true } },
        photos: true,
        translations: true,
      },
    });

    // 4. Sort the Prisma results based on the original IDs array order (which handles relevance sorting)
    const newsItemsMap = new Map(newsItems.map((n) => [n.id, n]));
    const sortedNewsItems = newsIds.map((id) => {
      const item = newsItemsMap.get(id)!;
      // Inject highlighted content into the matching translation if available
      if (highlightedMap[id]) {
        const tr = item.translations.find(
          (t) => t.languageCode === highlightedMap[id].languageCode
        );
        if (tr) {
          tr.title = highlightedMap[id].title;
          tr.content = highlightedMap[id].content;
        }
      }
      return item;
    });

    return {
      data: sortedNewsItems,
      total: totalCount,
      page: safePage,
      totalPages: Math.ceil(totalCount / safeLimit),
    };
  } catch (error) {
    console.error('Search error:', error);
    return { data: [], total: 0, page: safePage ?? 1, totalPages: 0 };
  }
}
