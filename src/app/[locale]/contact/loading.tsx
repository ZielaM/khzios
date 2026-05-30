import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';
import clsx from 'clsx';

export default function Loading() {
  return (
    <div className={style.page}>
      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.backLinkSkeleton)}
      />

      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.profileSkeleton)}
      />

      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.mapSkeleton)}
      />
    </div>
  );
}
