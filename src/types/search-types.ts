export type LanguageCode = 'pl' | 'en' | 'uk' | 'ru';

export type SortBy = 'date' | 'relevance';

export interface SearchParams {
  query?: string;
  language: LanguageCode;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: SortBy;
}

export interface ValidatedSearchParams {
  safePage: number;
  safeLimit: number;
  safeQuery?: string;
  safeTags?: string[];
  safeLanguage: LanguageCode;
  fallbackLanguages: readonly LanguageCode[];
  dictionary: string;
  safeSortBy: SortBy;
}
