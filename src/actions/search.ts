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
  limit = 20,
  sortBy = 'date',
}: SearchParams) {
  // Języki fallback dla danego locale (np. uk → ['uk', 'en', 'pl'])
  const fallbackLanguages = FALLBACK_CHAIN[language] ?? [language, 'en', 'pl'];

  const dictionary = (() => {
    switch (language) {
      case 'en':
        return 'english';
      case 'ru':
        return 'russian';
      default:
        return 'simple';
    }
  })();

  try {
    const offset = (page - 1) * limit;

    // We will build the where conditions for Prisma to get IDs
    // Since FTS uses raw sql, we'll fetch IDs via raw sql if query is present, otherwise pure Prisma

    let newsIds: string[] = [];
    const highlightedMap: Record<
      string,
      { title: string; content: string; languageCode: string }
    > = {};
    let totalCount = 0;

    if (query) {
      // 1. Raw SQL for Full Text Search to get matching IDs, highlighting, and count
      // Szukamy we wszystkich językach z fallback chain, priorytetyzując trafienia
      // w preferowanym języku użytkownika
      const sqlParts = [];
      const countParts = [];

      const selectPart = Prisma.sql`SELECT n.id, nt."languageCode", ts_headline(${dictionary}::regconfig, nt.title, websearch_to_tsquery(${dictionary}::regconfig, ${query}), 'StartSel=<mark>, StopSel=</mark>, MaxFragments=0') AS highlighted_title, ts_headline(${dictionary}::regconfig, nt.content, websearch_to_tsquery(${dictionary}::regconfig, ${query}), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS highlighted_content, ts_rank(to_tsvector(${dictionary}::regconfig, nt.title || ' ' || nt.content), websearch_to_tsquery(${dictionary}::regconfig, ${query})) AS rank`;
      const selectCountPart = Prisma.sql`SELECT CAST(COUNT(DISTINCT n.id) AS INTEGER) as total`;

      const fromPart = Prisma.sql`FROM "News" n JOIN "NewsTranslation" nt ON nt."newsId" = n.id`;

      sqlParts.push(selectPart, fromPart);
      countParts.push(selectCountPart, fromPart);

      const whereParts = [];
      // Szukaj w tłumaczeniach ze wszystkich języków w fallback chain
      const langConditions = fallbackLanguages.map(
        (lang) =>
          Prisma.sql`nt."languageCode" = CAST(${lang} AS "LanguageCode")`
      );
      whereParts.push(Prisma.sql`(${Prisma.join(langConditions, ' OR ')})`);
      whereParts.push(Prisma.sql`n.published = true`);
      whereParts.push(
        Prisma.sql`to_tsvector(${dictionary}::regconfig, nt.title || ' ' || nt.content) @@ websearch_to_tsquery(${dictionary}::regconfig, ${query})`
      );

      if (tag) {
        // Podziel tagi po przecinku
        const tags = tag.split(',').map((t) => t.trim());

        // Find news IDs that have ANY of these tags (in any language translation or native)
        const tagConditions = tags.map(
          (t) => Prisma.sql`t.name = ${t} OR tt.name = ${t}`
        );
        whereParts.push(
          Prisma.sql`n.id IN (SELECT "A" FROM "_NewsToTag" rel JOIN "Tag" t ON t.id = rel."B" LEFT JOIN "TagTranslation" tt ON tt."tagId" = t.id WHERE ${Prisma.join(tagConditions, ' OR ')})`
        );
      }

      const whereClause = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`;
      sqlParts.push(whereClause);
      countParts.push(whereClause);

      const orderBy =
        sortBy === 'relevance'
          ? Prisma.sql`ORDER BY rank DESC, n."createdAt" DESC`
          : Prisma.sql`ORDER BY n."createdAt" DESC`;

      sqlParts.push(orderBy);
      sqlParts.push(
        Prisma.sql`LIMIT ${limit * fallbackLanguages.length} OFFSET 0`
      );

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

      // Deduplikacja: dla każdego news ID zachowaj najlepsze tłumaczenie
      // (priorytet wg fallback chain, potem rank)
      const bestByNewsId = new Map<
        string,
        {
          id: string;
          languageCode: string;
          highlighted_title: string;
          highlighted_content: string;
          rank: number;
        }
      >();

      for (const r of rawResults) {
        const existing = bestByNewsId.get(r.id);
        if (!existing) {
          bestByNewsId.set(r.id, r);
        } else {
          // Preferuj tłumaczenie wyżej w fallback chain
          const existingPriority = fallbackLanguages.indexOf(
            existing.languageCode
          );
          const newPriority = fallbackLanguages.indexOf(r.languageCode);
          if (
            newPriority < existingPriority ||
            (newPriority === existingPriority && r.rank > existing.rank)
          ) {
            bestByNewsId.set(r.id, r);
          }
        }
      }

      // Posortuj deduplikowane wyniki i zastosuj paginację
      const deduplicated = Array.from(bestByNewsId.values());
      if (sortBy === 'relevance') {
        deduplicated.sort((a, b) => b.rank - a.rank);
      }
      const paginated = deduplicated.slice(offset, offset + limit);

      newsIds = paginated.map((r) => r.id);
      totalCount = rawCount[0]?.total || 0;

      for (const r of paginated) {
        highlightedMap[r.id] = {
          title: r.highlighted_title,
          content: r.highlighted_content,
          languageCode: r.languageCode,
        };
      }
    } else {
      // 2. Pure Prisma for normal filtering
      // Pokaż wszystkie opublikowane newsy — fallback tłumaczeń obsługuje NewsTile
      const whereCondition: Prisma.NewsWhereInput = {
        published: true,
      };

      if (tag) {
        const tags = tag.split(',').map((t) => t.trim());
        whereCondition.tags = {
          some: {
            OR: tags.flatMap((t) => [
              { name: t },
              { translations: { some: { name: t } } },
            ]),
          },
        };
      }

      const [newsData, count] = await Promise.all([
        prisma.news.findMany({
          where: whereCondition,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          select: { id: true },
        }),
        prisma.news.count({ where: whereCondition }),
      ]);

      newsIds = newsData.map((n) => n.id);
      totalCount = count;
    }

    if (newsIds.length === 0) {
      return { data: [], total: 0, page, totalPages: 0 };
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
    const sortedNewsItems = newsIds.map((id) => {
      const item = newsItems.find((n) => n.id === id)!;
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
      page,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error('Błąd wyszukiwania:', error);
    return { data: [], total: 0, page, totalPages: 0 };
  }
}
