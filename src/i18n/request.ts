import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale value from path segment [locale]
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Dynamic import of the locale JSON file.
    // This allows next-intl to only bundle and load the translation strings
    // needed for the currently active language, reducing client-side load time.
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
