import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';
import clsx from 'clsx';
import { PageHeaderSkeleton } from '@/components/Skeleton';

export default function Loading() {
  const rowSkeletons = Array.from({ length: 5 });
  const announcementSkeletons = Array.from({ length: 2 });
  const docRowSkeletons = Array.from({ length: 5 });

  return (
    <div className={style.page} aria-hidden="true">
      <PageHeaderSkeleton image />

      <div className={skeletonStyle.announcementsContainerSkeleton}>
        <div className={skeletonStyle.announcementsHeaderSkeleton}>
          <div
            className={clsx(
              skeletonStyle.skeleton,
              skeletonStyle.announcementsTitleSkeleton
            )}
          />
          <div
            className={clsx(
              skeletonStyle.skeleton,
              skeletonStyle.announcementsToggleSkeleton
            )}
          />
        </div>
        <div className={skeletonStyle.announcementsListSkeleton}>
          {announcementSkeletons.map((_, i) => (
            <div
              key={i}
              className={clsx(
                skeletonStyle.skeleton,
                skeletonStyle.announcementSkeleton
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.titleSkeleton)}
      />

      <div className={skeletonStyle.tableContainerSkeleton}>
        {rowSkeletons.map((_, i) => (
          <div
            key={i}
            className={clsx(
              skeletonStyle.skeleton,
              skeletonStyle.tableRowSkeleton
            )}
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>

      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.titleSkeleton)}
      />

      <div className={skeletonStyle.tableContainerSkeleton}>
        {docRowSkeletons.map((_, i) => (
          <div
            key={i}
            className={clsx(
              skeletonStyle.skeleton,
              skeletonStyle.tableRowSkeleton
            )}
            style={{ animationDelay: `${(i + 5) * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
