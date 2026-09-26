import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from './routing';

/**
 * Checks the [locale] segment and sets it as the request locale. Every page
 * has to check on its own because pages render in parallel with the layout,
 * and paths the proxy skips (/api/..., /file.php) reach [locale] with any
 * value.
 */
export function setPageLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}
