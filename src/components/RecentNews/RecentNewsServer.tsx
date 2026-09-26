import { getTranslations } from 'next-intl/server';
import { getRecentNews } from '@/lib/news-queries';
import NewsListItem from '@/components/NewsListItem';
import styles from './RecentNews.module.scss';

/** Home page news: the latest article large, the next four as a list. */
export default async function RecentNewsServer({ locale }: { locale: string }) {
  const [lead, ...rest] = await getRecentNews(5);
  if (!lead) {
    const t = await getTranslations('HomePage');
    return <p className={styles.empty}>{t('noNews')}</p>;
  }

  return (
    <div className={styles.layout}>
      <NewsListItem news={lead} locale={locale} featured />
      {rest.length > 0 && (
        <div className={styles.list}>
          {rest.map((item) => (
            <NewsListItem key={item.id} news={item} locale={locale} compact />
          ))}
        </div>
      )}
    </div>
  );
}
