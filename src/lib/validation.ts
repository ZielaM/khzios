import { SearchParams, ValidatedSearchParams } from '@/types/search-types';
import { FALLBACK_CHAIN } from './translations';
import { createLogger } from '@/lib/logger';
import { auditInput } from '@/lib/security';
import { parseDateInput, startOfDayOffset } from '@/lib/dates';

const log = createLogger('validation');

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
    dateFrom,
    dateTo,
  } = params;

  // Values come from the URL, so anything may arrive here (arrays for
  // repeated keys, garbage from crawlers); coerce defensively.
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

  // ── Security audits ────────────────────────────────────────────────────

  // Log suspicious parameter clamping (potential abuse or buggy clients)
  if (safePage !== rawPage || safeLimit !== rawLimit) {
    log.warn(
      { rawPage, safePage, rawLimit, safeLimit },
      'Search parameters were clamped — possible abuse'
    );
  }

  // Scan search query for injection / XSS patterns
  if (rawQuery) {
    auditInput('search_query', rawQuery, { language });
  }

  // Scan tag filter for injection patterns
  if (rawTag) {
    auditInput('tag_filter', rawTag, { language });
  }

  // ── Sanitisation ───────────────────────────────────────────────────────

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

  // Log when an invalid language is received (scanning / fuzzing indicator)
  if (!allowedLanguages.includes(language)) {
    log.warn(
      { receivedLanguage: String(language).substring(0, 20) },
      '⚠ Invalid language code received — possible fuzzing'
    );
  }

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

  const lastDay = parseDateInput(dateTo);

  return {
    safePage,
    safeLimit,
    safeQuery,
    safeTags,
    safeLanguage,
    fallbackLanguages,
    dictionary,
    safeSortBy: sortBy === 'relevance' ? 'relevance' : 'date',
    safeDateFrom: parseDateInput(dateFrom),
    // The whole `dateTo` day is included in the results
    safeDateBefore: lastDay && startOfDayOffset(lastDay, 1),
  };
}
