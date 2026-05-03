'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { routing, type Locale } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import style from './LanguageSwitcher.module.scss';
import clsx from 'clsx';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('LocaleSwitcher');

  const params = useParams();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(
      { pathname, params } as Parameters<typeof router.replace>[0],
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
