'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Home, FileQuestion } from 'lucide-react';
import style from './NotFoundPage.module.scss';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <div className={style.notFoundContainer}>
      <div className={style.errorIcon}>
        <FileQuestion size={120} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h1 className={style.title}>{t('title')}</h1>
      <p className={style.description}>{t('description')}</p>
      <Link href="/" className={style.homeButton}>
        <Home size={20} aria-hidden="true" />
        {t('backHome')}
      </Link>
    </div>
  );
}
