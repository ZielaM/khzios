import { Suspense } from 'react';
import styles from './page.module.scss';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RecentNewsServer from '@/components/RecentNews/RecentNewsServer';
import RecentNewsSkeleton from '@/components/RecentNews/RecentNewsSkeleton';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('HomePage');

  return (
    <div className={styles.main}>
      <h1>{t('title')}</h1>
      <div className={styles.container}>
        <Suspense fallback={<RecentNewsSkeleton />}>
          <RecentNewsServer locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
