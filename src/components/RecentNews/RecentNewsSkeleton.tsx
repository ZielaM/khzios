import NewsTileSkeleton from '@/components/NewsTile/NewsTileSkeleton';
import styles from './RecentNews.module.scss';

export default function RecentNewsSkeleton() {
  return (
    <div className={styles.grid}>
      <NewsTileSkeleton />
      <NewsTileSkeleton />
      <NewsTileSkeleton />
    </div>
  );
}
