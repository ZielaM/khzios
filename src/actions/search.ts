'use server';

import { prisma } from '@/lib/prisma';

export async function searchPublishedNews(
  query: string,
  language: 'pl' | 'en' | 'uk' | 'ru'
) {
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
    const results = await prisma.$queryRaw`
      SELECT 
        n.id, 
        n."createdAt", 
        nt.title, 
        nt.content,
        ts_rank(nt."searchVector", websearch_to_tsquery(${dictionary}::regconfig, ${query})) AS rank
      FROM "NewsTranslation" nt
      JOIN "News" n ON nt."newsId" = n.id
      WHERE 
        nt."languageCode" = CAST(${language} AS "LanguageCode")
        AND n.published = true
        AND nt."searchVector" @@ websearch_to_tsquery(${dictionary}::regconfig, ${query})
      ORDER BY rank DESC, n."createdAt" DESC
      LIMIT 20;
    `;

    return results;
  } catch (error) {
    console.error('Błąd wyszukiwania FTS:', error);
    return [];
  }
}
