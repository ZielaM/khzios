import { Prisma } from '@/generated/prisma/client';
import type { LanguageCode } from '@/types/search-types';

/**
 * CTE `queries (lang, position, query)`: the search text as a tsquery for
 * every language of the fallback chain, `position` being its place in the
 * chain. Each query is parsed with the text search configuration of its own
 * language (`search_config`, see the migrations), the one the triggers use for
 * stored vectors, so a Polish word typed by an English reader still matches
 * the inflected forms in Polish translations.
 */
export function languageQueries(
  languages: readonly LanguageCode[],
  query: string
): Prisma.Sql {
  const chain = Prisma.join(
    languages.map((lang) => Prisma.sql`CAST(${lang} AS "LanguageCode")`)
  );
  return Prisma.sql`queries AS (
    SELECT lang, position, websearch_to_tsquery(search_config(lang), ${query}) AS query
    FROM unnest(ARRAY[${chain}]) WITH ORDINALITY AS chain (lang, position)
  )`;
}
