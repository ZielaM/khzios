import styles from './page.module.scss';
import RecentNewsSkeleton from '@/components/RecentNews/RecentNewsSkeleton';

export default function Loading() {
  return (
    <div className={styles.main}>
      <h1>...</h1>
      <div className={styles.container}>
        <RecentNewsSkeleton />
      </div>
    </div>
  );
}
