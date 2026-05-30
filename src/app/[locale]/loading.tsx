import styles from './page.module.scss';
import skeletonStyle from './loading.module.scss';
import RecentNewsSkeleton from '@/components/RecentNews/RecentNewsSkeleton';
import clsx from 'clsx';

export default function Loading() {
  const bentoSkeletons = Array.from({ length: 4 });

  return (
    <div className={styles.main}>
      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.heroSkeleton)}
      />

      <section className={styles.newsSection}>
        <div
          className={clsx(
            skeletonStyle.skeleton,
            skeletonStyle.sectionTitleSkeleton
          )}
        />
        <RecentNewsSkeleton />
      </section>

      <div
        className={clsx(
          skeletonStyle.skeleton,
          skeletonStyle.sectionTitleSkeleton
        )}
      />

      <div className={styles.bentoGrid}>
        {bentoSkeletons.map((_, i) => (
          <div
            key={i}
            className={clsx(
              skeletonStyle.skeleton,
              skeletonStyle.bentoCardSkeleton
            )}
          />
        ))}
      </div>
    </div>
  );
}
