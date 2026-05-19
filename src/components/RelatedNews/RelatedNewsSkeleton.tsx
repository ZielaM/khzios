import style from './RelatedNewsSkeleton.module.scss';

/**
 * Skeleton fallback for the RelatedNews Suspense boundary.
 * Shows a pulsing placeholder that mirrors the related articles grid layout.
 */
export default function RelatedNewsSkeleton() {
  return (
    <div className={style.relatedSkeleton}>
      <div className={style.relatedSkeletonTitle} />
      <div className={style.relatedSkeletonGrid}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={style.relatedSkeletonCard}>
            <div className={style.relatedSkeletonImage} />
            <div className={style.relatedSkeletonContent}>
              <div className={style.relatedSkeletonDate} />
              <div className={style.relatedSkeletonCardTitle} />
              <div className={style.relatedSkeletonCardTitleShort} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
