import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';
import clsx from 'clsx';

export default function Loading() {
  return (
    <div className={style.page}>
      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.backLinkSkeleton)}
      />

      <section
        className={clsx(
          style.hero,
          skeletonStyle.skeleton,
          skeletonStyle.heroSkeleton
        )}
      />

      <div className={style.grid}>
        <div
          className={clsx(skeletonStyle.skeleton, skeletonStyle.cardSkeleton)}
        />
        <div
          className={clsx(skeletonStyle.skeleton, skeletonStyle.cardSkeleton)}
        />
      </div>
    </div>
  );
}
