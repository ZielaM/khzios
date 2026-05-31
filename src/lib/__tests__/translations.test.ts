import { describe, it, expect } from 'vitest';
import { resolveTranslation, resolveTagName } from '../translations';

// ─── Helpers ───────────────────────────────────────────────────────────

const tr = (languageCode: string, title: string) => ({
  languageCode,
  title,
  content: '',
});

const tag = (
  name: string,
  translations: { languageCode: string; name: string }[]
) => ({
  name,
  translations,
});

// Zrezygnowano z testowania stałych FALLBACK_CHAIN oraz LANGUAGE_NAMES.
// Weryfikacją ich struktury zajmuje się TypeScript poprzez typowanie Record<LanguageCode, ...>.

// ─── resolveTranslation ──────────────────────────────────────────────

describe('resolveTranslation', () => {
  describe('exact match (no fallback needed)', () => {
    it.each([
      ['pl', 'Polski tytuł'],
      ['en', 'English title'],
    ])('should return exact match for "%s" locale', (locale, expectedTitle) => {
      // Arrange
      const translations = [
        tr('pl', 'Polski tytuł'),
        tr('en', 'English title'),
      ];

      // Act
      const { translation, isFallback } = resolveTranslation(
        translations,
        locale
      );

      // Assert
      expect(translation?.title).toBe(expectedTitle);
      expect(isFallback).toBe(false);
    });
  });

  describe('fallback chain resolution', () => {
    it.each([
      {
        locale: 'en',
        translations: [tr('pl', 'Polski tytuł')],
        expectedTitle: 'Polski tytuł',
        scenario: 'falls back to "pl" when "en" is missing',
      },
      {
        locale: 'uk',
        translations: [tr('pl', 'Polski tytuł'), tr('en', 'English title')],
        expectedTitle: 'English title',
        scenario: 'falls back to "en" when "uk" is missing',
      },
      {
        locale: 'uk',
        translations: [tr('pl', 'Polski tytuł')],
        expectedTitle: 'Polski tytuł',
        scenario: 'falls back to "pl" when both "uk" and "en" are missing',
      },
    ])('$scenario', ({ locale, translations, expectedTitle }) => {
      const { translation, isFallback } = resolveTranslation(
        translations,
        locale
      );

      expect(translation?.title).toBe(expectedTitle);
      expect(isFallback).toBe(true);
    });

    it('should prefer exact match over fallback for Ukrainian locale', () => {
      const translations = [
        tr('uk', 'Українська назва'),
        tr('en', 'English title'),
        tr('pl', 'Polski tytuł'),
      ];

      const { translation, isFallback } = resolveTranslation(
        translations,
        'uk'
      );

      expect(translation?.title).toBe('Українська назва');
      expect(isFallback).toBe(false);
    });
  });

  describe('edge cases & unknown locales', () => {
    it('should return undefined when translations array is empty', () => {
      const { translation, isFallback } = resolveTranslation([], 'en');

      expect(translation).toBeUndefined();
      expect(isFallback).toBe(false);
    });

    it('should return first available translation when no language in the chain matches', () => {
      const translations = [tr('de', 'Deutscher Titel')];
      const { translation, isFallback } = resolveTranslation(
        translations,
        'en'
      );

      expect(translation?.title).toBe('Deutscher Titel');
      expect(isFallback).toBe(true);
    });

    it('should handle unknown locale by generating dynamic chain [locale, "en", "pl"]', () => {
      const translations = [
        tr('de', 'Deutscher Titel'),
        tr('en', 'English title'),
      ];
      const { translation, isFallback } = resolveTranslation(
        translations,
        'de'
      );

      expect(translation?.title).toBe('Deutscher Titel');
      expect(isFallback).toBe(false);
    });

    it('should fall back to "en" when dynamic chain is used and exact locale is missing', () => {
      const translations = [
        tr('en', 'English title'),
        tr('pl', 'Polski tytuł'),
      ];
      const { translation, isFallback } = resolveTranslation(
        translations,
        'ja'
      );

      expect(translation?.title).toBe('English title');
      expect(isFallback).toBe(true);
    });
  });
});

// ─── resolveTagName ──────────────────────────────────────────────────

describe('resolveTagName', () => {
  it.each([
    {
      locale: 'en',
      tagObj: tag('psy', [
        { languageCode: 'pl', name: 'Psy' },
        { languageCode: 'en', name: 'Dogs' },
      ]),
      expected: 'Dogs',
      scenario: 'translated tag name for the given locale',
    },
    {
      locale: 'en',
      tagObj: tag('psy', []),
      expected: 'psy',
      scenario: 'native tag name when translations array is empty',
    },
    {
      locale: 'uk',
      tagObj: tag('psy', [{ languageCode: 'pl', name: 'Psy' }]),
      expected: 'Psy',
      scenario: 'fallback through the chain to find a translation',
    },
    {
      locale: 'uk',
      tagObj: tag('psy', [
        { languageCode: 'pl', name: 'Psy' },
        { languageCode: 'uk', name: 'Собаки' },
      ]),
      expected: 'Собаки',
      scenario: 'exact locale match over fallback',
    },
    {
      locale: 'en',
      tagObj: tag('zwierzęta', [{ languageCode: 'de', name: 'Tiere' }]),
      expected: 'Tiere',
      scenario:
        'first available translation when translations array has no matching language in chain',
    },
  ])('should return $scenario', ({ locale, tagObj, expected }) => {
    expect(resolveTagName(tagObj, locale)).toBe(expected);
  });
});
