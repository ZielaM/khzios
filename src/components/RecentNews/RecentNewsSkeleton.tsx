import NewsTileSkeleton from '@/components/NewsTile/NewsTileSkeleton';
import styles from '@/app/[locale]/page.module.scss';

export default function RecentNewsSkeleton() {
  return (
    <div className={styles.grid}>
      <NewsTileSkeleton />
      <NewsTileSkeleton />
      <NewsTileSkeleton />
    </div>
  );
}
