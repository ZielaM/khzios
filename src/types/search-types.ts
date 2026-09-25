export type LanguageCode = 'pl' | 'en' | 'uk' | 'ru';

export type SortBy = 'date' | 'relevance';

export interface SearchParams {
  query?: string;
  language: LanguageCode;
  tag?: string;
  page?: number;
  limit?: number;
  sortBy?: SortBy;
  dateFrom?: string;
  dateTo?: string;
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
  /** Inclusive lower bound: start of the `dateFrom` day */
  safeDateFrom?: Date;
  /** Exclusive upper bound: start of the day after `dateTo` */
  safeDateBefore?: Date;
}
