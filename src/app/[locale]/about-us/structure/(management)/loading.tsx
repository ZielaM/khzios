import skeletonStyle from './loading.module.scss';
import clsx from 'clsx';

export default function Loading() {
  return (
    <div className={skeletonStyle.page}>
      <div className={clsx(skeletonStyle.skeleton, skeletonStyle.backLink)} />

      <div className={clsx(skeletonStyle.skeleton, skeletonStyle.heroCard)}>
        <div className={clsx(skeletonStyle.skeleton, skeletonStyle.avatar)} />
        <div className={skeletonStyle.heroLines}>
          <div
            className={clsx(skeletonStyle.skeleton, skeletonStyle.heroLine1)}
          />
          <div
            className={clsx(skeletonStyle.skeleton, skeletonStyle.heroLine2)}
          />
          <div
            className={clsx(skeletonStyle.skeleton, skeletonStyle.heroLine3)}
          />
        </div>
      </div>

      <div className={skeletonStyle.infoGrid}>
        <div className={clsx(skeletonStyle.skeleton, skeletonStyle.infoCard)} />
        <div className={clsx(skeletonStyle.skeleton, skeletonStyle.infoCard)} />
      </div>
    </div>
  );
}
