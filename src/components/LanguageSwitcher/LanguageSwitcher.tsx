'use client';

// LanguageSwitcher Architecture:
// This component provides a UI to switch between available locales (PL, EN, etc.).
// It uses Next.js `useRouter` from `next-intl` to replace the current URL
// while retaining any active dynamic route parameters (e.g. news IDs)
// and search query parameters without causing a full page refresh.

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing, type Locale } from '@/i18n/routing';
import { useParams, useSearchParams } from 'next/navigation';
import style from './LanguageSwitcher.module.scss';
import clsx from 'clsx';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('LocaleSwitcher');
  const searchParams = useSearchParams();

  // Grab any dynamic route segments (like [id]) to retain them during locale switch
  const params = useParams();

  // Route Replacement Logic:
  // Using router.replace() instead of push() prevents filling the browser history
  // with localized versions of the exact same page, which can be frustrating
  // if the user tries to hit the "Back" button later.
  const handleLocaleChange = (newLocale: string) => {
    router.replace(
      {
        pathname,
        params: params as any,
        query: Object.fromEntries(searchParams.entries()),
      },
      { locale: newLocale as Locale }
    );
  };

  return (
    <div className={style.switcher} role="group" aria-label={t('label')}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={clsx(style.localeButton, {
            [style.active]: locale === loc,
          })}
          aria-label={t('switchTo', { locale: loc.toUpperCase() })}
          // ARIA attributes for screen readers to announce the currently active locale
          aria-current={locale === loc ? 'true' : undefined}
          disabled={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
