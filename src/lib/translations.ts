/**
 * Centralna logika rozwiązywania tłumaczeń z fallbackiem.
 *
 * Każdy obiekt (News, Tag, itp.) ma swoją tablicę tłumaczeń —
 * te helpery operują na tablicy konkretnego obiektu,
 * więc fallback jest rozwiązywany per-instancję.
 */

/**
 * Kolejność języków fallback.
 * Np. dla locale='uk': szukaj uk → en → pl
 */
export const FALLBACK_CHAIN: Record<string, readonly string[]> = {
  pl: ['pl'],
  en: ['en', 'pl'],
  uk: ['uk', 'en', 'pl'],
  ru: ['ru', 'en', 'pl'],
};

/** Nazwy języków do wyświetlenia w badgu fallback */
export const LANGUAGE_NAMES: Record<string, string> = {
  pl: 'polski',
  en: 'English',
  uk: 'українська',
  ru: 'русский',
};

/**
 * Rozwiązuje tłumaczenie z łańcucha fallback dla konkretnego obiektu.
 * Zwraca { translation, isFallback }.
 *
 * @param translations - tablica tłumaczeń danego obiektu (News, Tag, itp.)
 * @param locale - żądany język użytkownika
 */
export function resolveTranslation<T extends { languageCode: string }>(
  translations: T[],
  locale: string
): { translation: T | undefined; isFallback: boolean } {
  const chain = FALLBACK_CHAIN[locale] ?? [locale, 'en', 'pl'];

  for (const lang of chain) {
    const found = translations.find((t) => t.languageCode === lang);
    if (found) {
      return {
        translation: found,
        isFallback: found.languageCode !== locale,
      };
    }
  }

  return { translation: undefined, isFallback: false };
}

/**
 * Rozwiązuje nazwę tagu z fallbackiem na inne języki,
 * a w ostateczności na natywną nazwę tagu.
 *
 * @param tag - obiekt tagu z jego tablicą tłumaczeń
 * @param locale - żądany język użytkownika
 */
export function resolveTagName(
  tag: { name: string; translations: { languageCode: string; name: string }[] },
  locale: string
): string {
  const { translation } = resolveTranslation(tag.translations, locale);
  return translation?.name ?? tag.name;
}
