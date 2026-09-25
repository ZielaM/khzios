import { getRecentNews } from '@/lib/news-queries';
import NewsTile from '@/components/NewsTile';
import styles from './RecentNews.module.scss';

export default async function RecentNewsServer({ locale }: { locale: string }) {
  const news = await getRecentNews(3);

  return (
    <div className={styles.grid}>
      {news.map((item) => (
        <NewsTile key={item.id} news={item} locale={locale} />
      ))}
    </div>
  );
}
