import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';
import clsx from 'clsx';

export default function Loading() {
  const rowSkeletons = Array.from({ length: 5 });

  return (
    <div className={style.page}>
      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.backLinkSkeleton)}
      />

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
    </div>
  );
}
