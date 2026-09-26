import { PageHeaderSkeleton, SkeletonBlock } from '@/components/Skeleton';
import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';

export default function Loading() {
  return (
    <div className={style.page} aria-hidden="true">
      <PageHeaderSkeleton />
      <SkeletonBlock className={skeletonStyle.profileSkeleton} />
      <SkeletonBlock className={skeletonStyle.mapSkeleton} />
    </div>
  );
}
