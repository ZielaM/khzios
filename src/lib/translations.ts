/**
 * Picks a translation for the requested language from a record's own
 * translations, falling back along FALLBACK_CHAIN. The fallback is resolved
 * per record, so one article can be in English while the next is in Polish.
 */

import { LanguageCode } from '@/types/search-types';

/** Languages tried in order, e.g. uk → en → pl. */
const EN_FALLBACK: readonly LanguageCode[] = ['en', 'pl'];

export const FALLBACK_CHAIN: Record<LanguageCode, readonly LanguageCode[]> = {
  pl: ['pl'],
  en: EN_FALLBACK,
  uk: ['uk', ...EN_FALLBACK],
  ru: ['ru', ...EN_FALLBACK],
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  pl: 'polski',
  en: 'English',
  uk: 'українська',
  ru: 'русский',
};

/**
 * Resolves translation from the fallback chain for a specific object.
 * Returns { translation, isFallback }.
 *
 * @param translations - translations array for a given object (News, Tag, etc.)
 * @param locale - user's requested language
 */
export function resolveTranslation<T extends { languageCode: string }>(
  translations: T[],
  locale: string
): { translation: T | undefined; isFallback: boolean } {
  const chain = FALLBACK_CHAIN[locale as LanguageCode] ?? [
    locale,
    ...FALLBACK_CHAIN.en,
  ];

  for (const lang of chain) {
    const found = translations.find((t) => t.languageCode === lang);
    if (found) {
      return {
        translation: found,
        isFallback: found.languageCode !== locale,
      };
    }
  }

  // Any translation is better than none
  if (translations.length > 0) {
    return { translation: translations[0], isFallback: true };
  }

  return { translation: undefined, isFallback: false };
}

/**
 * Resolves a tag name falling back to other languages,
 * and ultimately to the native tag name.
 *
 * @param tag - tag object with its translations array
 * @param locale - user's requested language
 */
export function resolveTagName(
  tag: { name: string; translations: { languageCode: string; name: string }[] },
  locale: string
): string {
  const { translation } = resolveTranslation(tag.translations, locale);
  return translation?.name ?? tag.name;
}
