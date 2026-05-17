import { describe, it, expect } from 'vitest';
import { validateSearchParams } from '../validation';
import { SearchParams } from '@/types/search-types';

describe('validateSearchParams', () => {
  describe('combinations of params checks', () => {
    describe('logic checks', () => {
      it('should return correct defaults when only language is provided', () => {
        const result = validateSearchParams({ language: 'en' });

        expect(result.safePage).toBe(1);
        expect(result.safeLimit).toBe(12);
        expect(result.safeQuery).toBeUndefined();
        expect(result.safeTags).toBeUndefined();
        expect(result.safeLanguage).toBe('en');
        expect(result.safeSortBy).toBe('date');
        expect(result.dictionary).toBe('english');
        expect(result.fallbackLanguages).toEqual(['en', 'pl']);
      });

      it('should process a full set of typical search parameters', () => {
        const result = validateSearchParams({
          language: 'pl',
          query: '  hodowla zwierząt  ',
          tag: '  psy , koty ',
          page: 3,
          limit: 24,
          sortBy: 'relevance',
        });

        expect(result.safePage).toBe(3);
        expect(result.safeLimit).toBe(24);
        expect(result.safeQuery).toBe('hodowla zwierząt');
        expect(result.safeTags).toEqual(['psy', 'koty']);
        expect(result.safeLanguage).toBe('pl');
        expect(result.safeSortBy).toBe('relevance');
        expect(result.dictionary).toBe('simple');
      });
    });

    describe('wrong types check', () => {
      it('should not crash when all params are completely wrong types', () => {
        const result = validateSearchParams({
          query: 42,
          language: false,
          tag: { injection: true },
          page: 'not-a-number',
          limit: [100, 21],
          sortBy: null,
        } as unknown as SearchParams);

        expect(result.safeQuery).toBeUndefined();
        expect(result.safeTags).toBeUndefined();
        expect(result.safePage).toBe(1);
        expect(result.safeLimit).toBe(1);
        expect(result.safeLanguage).toBe('en');
        expect(result.safeSortBy).toBe('date');
      });
    });
  });

  describe('Sort By', () => {
    describe('logic check', () => {
      it('should set sortBy to "date" when explicitly set', () => {
        const result = validateSearchParams({ language: 'en', sortBy: 'date' });
        expect(result.safeSortBy).toBe('date');
      });

      it('should set sortBy to "relevance" when explicitly set', () => {
        const result = validateSearchParams({
          language: 'en',
          sortBy: 'relevance',
        });
        expect(result.safeSortBy).toBe('relevance');
      });

      it('should return "date" when sortBy is not valid', () => {
        const result = validateSearchParams({
          language: 'en',
          sortBy: 'not_a_sort_value' as unknown as SearchParams['sortBy'],
        });
        expect(result.safeSortBy).toBe('date');
      });
    });

    describe('wrong types check', () => {
      it('should not crash when sortBy is a number', () => {
        const result = validateSearchParams({
          language: 'en',
          sortBy: 1 as unknown as SearchParams['sortBy'],
        });
        expect(result.safeSortBy).toBe('date');
      });
    });
  });

  describe('Languages', () => {
    describe('logic check', () => {
      it('should return "english" dictionary and ["en", "pl"] fallback languages for "en"', () => {
        const result = validateSearchParams({ language: 'en' });
        expect(result.safeLanguage).toBe('en');
        expect(result.dictionary).toBe('english');
        expect(result.fallbackLanguages).toEqual(['en', 'pl']);
      });

      it('should return "russian" dictionary and ["ru", "en", "pl"] fallback languages for "ru"', () => {
        const result = validateSearchParams({ language: 'ru' });
        expect(result.safeLanguage).toBe('ru');
        expect(result.dictionary).toBe('russian');
        expect(result.fallbackLanguages).toEqual(['ru', 'en', 'pl']);
      });

      it('should return "simple" dictionary and ["pl"] fallback languages for "pl"', () => {
        const result = validateSearchParams({ language: 'pl' });
        expect(result.safeLanguage).toBe('pl');
        expect(result.dictionary).toBe('simple');
        expect(result.fallbackLanguages).toEqual(['pl']);
      });

      it('should return "simple" dictionary and ["uk", "en", "pl"] fallback languages for "uk"', () => {
        const result = validateSearchParams({ language: 'uk' });
        expect(result.safeLanguage).toBe('uk');
        expect(result.dictionary).toBe('simple');
        expect(result.fallbackLanguages).toEqual(['uk', 'en', 'pl']);
      });

      it('should return "english" dictionary and ["en", "pl"] fallback languages when language is not valid', () => {
        const result = validateSearchParams({
          language: 'not_a_language' as unknown as SearchParams['language'],
        });
        expect(result.safeLanguage).toBe('en');
        expect(result.dictionary).toBe('english');
        expect(result.fallbackLanguages).toEqual(['en', 'pl']);
      });

      it('should return "english" dictionary and ["en", "pl"] fallback languages when language is not provided', () => {
        const result = validateSearchParams({} as unknown as SearchParams);
        expect(result.safeLanguage).toBe('en');
        expect(result.dictionary).toBe('english');
        expect(result.fallbackLanguages).toEqual(['en', 'pl']);
      });
    });

    describe('wrong types check', () => {
      it('should not crash when language is a number', () => {
        const result = validateSearchParams({
          language: 999 as unknown as SearchParams['language'],
        });
        expect(result.safeLanguage).toBe('en');
        expect(result.dictionary).toBe('english');
        expect(result.fallbackLanguages).toEqual(['en', 'pl']);
      });
    });
  });

  describe('query and tag', () => {
    describe('logic checks', () => {
      it('should trim and truncate query and tag', () => {
        const result = validateSearchParams({
          language: 'en',
          query: '  hodowla zwierząt  ',
          tag: '  psy   ,   koty   ',
        });
        expect(result.safeQuery).toBe('hodowla zwierząt');
        expect(result.safeTags).toEqual(['psy', 'koty']);
      });

      it('should handle whitespace-only query and tag', () => {
        const result = validateSearchParams({
          language: 'en',
          query: '     ',
          tag: '   ',
        });
        expect(result.safeQuery).toBeUndefined();
        expect(result.safeTags).toBeUndefined();
      });

      it('should handle query that is exactly 256 characters', () => {
        const exactString = 'x'.repeat(256);
        const result = validateSearchParams({
          language: 'en',
          query: exactString,
        });
        expect(result.safeQuery?.length).toBe(256);
      });

      it('should handle query that is 257 characters (one over limit)', () => {
        const overString = 'x'.repeat(257);
        const result = validateSearchParams({
          language: 'en',
          query: overString,
        });
        expect(result.safeQuery?.length).toBe(256);
      });

      it('should truncate extremely long queries', () => {
        const longString = 'a'.repeat(10_000);
        const result = validateSearchParams({
          language: 'en',
          query: longString,
        });
        expect(result.safeQuery?.length).toBe(256);
      });

      it('should truncate extremely long tags', () => {
        const longString = [...Array(500).keys()]
          .map((i) => `tag ${i}`)
          .join(', ');
        const result = validateSearchParams({
          language: 'en',
          tag: longString,
        });
        expect(result.safeTags?.length).toBeLessThanOrEqual(256);
      });

      it('should remove duplicated tags', () => {
        const result = validateSearchParams({
          language: 'en',
          tag: '  psy , koty , psy, koty',
        });
        expect(result.safeTags).toEqual(['psy', 'koty']);
      });

      it('should drop the last tag if truncation cut through it', () => {
        const tag = 'short, ' + 'x'.repeat(300);
        const result = validateSearchParams({ language: 'en', tag });
        expect(result.safeTags).toEqual(['short']);
      });

      it('should handle comma-only tag string', () => {
        const result = validateSearchParams({
          language: 'en',
          tag: ',,,,,',
        });
        expect(result.safeTags).toBeUndefined();
      });
    });

    describe('wrong types check', () => {
      it('should not crash when query or tag is a number', () => {
        const result = validateSearchParams({
          language: 'en',
          query: 12345 as unknown as string,
          tag: 999 as unknown as string,
        });
        expect(result.safeQuery).toBeUndefined();
        expect(result.safeTags).toBeUndefined();
      });
    });
  });

  describe('pages and limits', () => {
    describe('logic checks', () => {
      it('should floor floating-point page and limit numbers', () => {
        const result = validateSearchParams({
          language: 'en',
          page: 3.7,
          limit: 15.9,
        });
        expect(result.safePage).toBe(3);
        expect(result.safeLimit).toBe(15);
      });

      it('should handle page = 0 and limit = 0 by clamping to 1', () => {
        const result = validateSearchParams({
          language: 'en',
          page: 0,
          limit: 0,
        });
        expect(result.safePage).toBe(1);
        expect(result.safeLimit).toBe(1);
      });

      it('should handle page = 1000 and limit = 60 (exact upper boundaries)', () => {
        const result = validateSearchParams({
          language: 'en',
          page: 1000,
          limit: 60,
        });
        expect(result.safePage).toBe(1000);
        expect(result.safeLimit).toBe(60);
      });

      it('should handle limit = 1 (exact lower boundary)', () => {
        const result = validateSearchParams({ language: 'en', limit: 1 });
        expect(result.safeLimit).toBe(1);
      });

      it('should clamp extreme page and limit values', () => {
        const result = validateSearchParams({
          language: 'en',
          page: 10_000_000,
          limit: 999_999,
        });
        expect(result.safePage).toBe(1000);
        expect(result.safeLimit).toBe(60);
      });

      it('should clamp negative page and limit values', () => {
        const result = validateSearchParams({
          language: 'en',
          page: -9999,
          limit: -100,
        });
        expect(result.safePage).toBe(1);
        expect(result.safeLimit).toBe(1);
      });

      it('should handle NaNs gracefully', () => {
        const result = validateSearchParams({
          language: 'en',
          page: NaN,
          limit: NaN,
        });
        expect(result.safePage).toBe(1);
        expect(result.safeLimit).toBe(1);
      });

      it('should handle Infinities gracefully', () => {
        const result = validateSearchParams({
          language: 'en',
          page: Infinity,
          limit: Infinity,
        });
        expect(result.safePage).toBe(1000);
        expect(result.safeLimit).toBe(60);
      });
    });

    describe('wrong types check', () => {
      it('should convert page or limit strings to numbers', () => {
        const result = validateSearchParams({
          language: 'en',
          page: '3' as unknown as number,
          limit: '24' as unknown as number,
        });
        expect(result.safePage).toBe(3);
        expect(result.safeLimit).toBe(24);
      });

      it('should not crash when page or limit is a non-numeric string', () => {
        const result = validateSearchParams({
          language: 'en',
          page: 'abc' as unknown as number,
          limit: 'def' as unknown as number,
        });
        expect(result.safePage).toBe(1);
        expect(result.safeLimit).toBe(1);
      });

      it('should not crash when page or limit is a multi-element array', () => {
        const result = validateSearchParams({
          language: 'en',
          page: [1, 2, 3] as unknown as number,
          limit: [24, 48, 96] as unknown as number,
        });
        expect(result.safePage).toBe(1);
        expect(result.safeLimit).toBe(1);
      });

      it('should convert page or limit from a single-element array into number', () => {
        const result = validateSearchParams({
          language: 'en',
          page: [2] as unknown as number,
          limit: [2] as unknown as number,
        });
        expect(result.safePage).toBe(2);
        expect(result.safeLimit).toBe(2);
      });
    });
  });
});
