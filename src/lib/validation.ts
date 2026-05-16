import { SearchParams, ValidatedSearchParams } from '@/types/search-types';
import { FALLBACK_CHAIN } from './translations';

export function validateSearchParams(
  params: SearchParams
): ValidatedSearchParams {
  const {
    query,
    language,
    tag,
    page = 1,
    limit = 12,
    sortBy = 'date',
  } = params;

  // Runtime type guards — Server Actions can be called directly via POST,
  // bypassing TypeScript entirely. Any param could be any type.
  const rawPage = typeof page === 'number' ? page : Number(page);
  const rawLimit = typeof limit === 'number' ? limit : Number(limit);
  const rawQuery = typeof query === 'string' ? query : undefined;
  const rawTag = typeof tag === 'string' ? tag : undefined;

  // Max 1000 pages to prevent extreme OFFSET
  // Guard against NaN — Math.max/min propagate NaN instead of clamping it
  const safePage = Math.min(
    1000,
    Math.max(1, Math.floor(isNaN(rawPage) ? 1 : rawPage))
  );
  const safeLimit = Math.min(
    60,
    Math.max(1, Math.floor(isNaN(rawLimit) ? 1 : rawLimit))
  );
  // Trim, truncate, and treat whitespace-only input as absent (undefined)
  const safeQuery = rawQuery?.trim().substring(0, 256) || undefined;
  const trimmedTag = rawTag?.trim();
  const truncatedTag = trimmedTag?.substring(0, 256);
  let safeTags: string[] | undefined = undefined;

  if (truncatedTag) {
    safeTags = truncatedTag
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (truncatedTag?.length !== trimmedTag?.length) {
      safeTags.pop();
    }
    safeTags = [...new Set(safeTags)];
    if (safeTags.length === 0) {
      safeTags = undefined;
    }
  }

  const allowedLanguages = ['pl', 'en', 'uk', 'ru'];
  const safeLanguage = allowedLanguages.includes(language) ? language : 'en';

  const fallbackLanguages = FALLBACK_CHAIN[safeLanguage];

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

  return {
    safePage,
    safeLimit,
    safeQuery,
    safeTags,
    safeLanguage,
    fallbackLanguages,
    dictionary,
    safeSortBy: sortBy === 'relevance' ? 'relevance' : 'date',
  };
}
