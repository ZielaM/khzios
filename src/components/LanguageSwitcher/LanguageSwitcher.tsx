'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing, type Locale } from '@/i18n/routing';
import { useParams, useSearchParams } from 'next/navigation';
import style from './LanguageSwitcher.module.scss';
import clsx from 'clsx';
import { Suspense } from 'react';

function LanguageSwitcherInner() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('LocaleSwitcher');
  const searchParams = useSearchParams();

  const params = useParams();

  // Same page in another language, keeping route params (e.g. an article id)
  // and the query. replace(): language versions are not separate history
  // entries.
  const handleLocaleChange = (newLocale: string) => {
    router.replace(
      {
        pathname,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          aria-current={locale === loc ? 'true' : undefined}
          disabled={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function LanguageSwitcher() {
  return (
    <Suspense fallback={<div className={style.switcher}>...</div>}>
      <LanguageSwitcherInner />
    </Suspense>
  );
}
