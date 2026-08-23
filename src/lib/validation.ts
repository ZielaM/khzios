import { SearchParams, ValidatedSearchParams } from '@/types/search-types';
import { FALLBACK_CHAIN } from './translations';
import { createLogger } from '@/lib/logger';
import { auditInput, auditId } from '@/lib/security';

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
    cursorId,
    dateFrom,
    dateTo,
  } = params;

  // Runtime type guards — Server Actions can be called directly via POST,
  // bypassing TypeScript entirely. Any param could be any type.
  const rawPage = typeof page === 'number' ? page : Number(page);
  const rawLimit = typeof limit === 'number' ? limit : Number(limit);
  const rawQuery = typeof query === 'string' ? query : undefined;
  const rawTag = typeof tag === 'string' ? tag : undefined;
  const safeCursorId = typeof cursorId === 'string' ? cursorId : undefined;

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

  // Validate cursor ID format (should be a UUID — anything else is suspicious)
  if (safeCursorId) {
    auditId('cursor_id', safeCursorId, { language });
  }

  // Detect non-string types passed to string params (Server Action abuse)
  if (query !== undefined && typeof query !== 'string') {
    log.warn(
      { receivedType: typeof query },
      '⚠ Non-string query parameter received — possible Server Action abuse'
    );
  }
  if (tag !== undefined && typeof tag !== 'string') {
    log.warn(
      { receivedType: typeof tag },
      '⚠ Non-string tag parameter received — possible Server Action abuse'
    );
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

  const parseDate = (d: unknown) => {
    if (!d || typeof d !== 'string') return undefined;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  return {
    safePage,
    safeLimit,
    safeQuery,
    safeTags,
    safeLanguage,
    fallbackLanguages,
    dictionary,
    safeSortBy: sortBy === 'relevance' ? 'relevance' : 'date',
    safeCursorId,
    safeDateFrom: parseDate(dateFrom),
    safeDateTo: parseDate(dateTo),
  };
}
