import styles from './page.module.scss';
import { prisma } from '@/lib/prisma';
import NewsTile from '@/components/NewsTile';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function Home({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('HomePage');

  const news = await prisma.news.findMany({
    take: 3,
    where: { published: true },
    include: {
      tags: { include: { translations: true } },
      photos: true,
      translations: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={styles.main}>
      <h1>{t('title')}</h1>
      <div className={styles.container}>
        <div className={styles.grid}>
          {news.map((item) => (
            <NewsTile key={item.id} news={item} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}
