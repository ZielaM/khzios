import RecentNewsSkeleton from '@/components/RecentNews/RecentNewsSkeleton';
import { PageHeaderSkeleton } from '@/components/Skeleton';
import styles from './page.module.scss';

export default function Loading() {
  return (
    <div className={styles.main} aria-hidden="true">
      <PageHeaderSkeleton breadcrumbs={false} image />
      <RecentNewsSkeleton />
    </div>
  );
}
