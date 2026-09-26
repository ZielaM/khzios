import { PageHeaderSkeleton, SkeletonBlock } from '@/components/Skeleton';
import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';

export default function Loading() {
  return (
    <div className={style.page} aria-hidden="true">
      <PageHeaderSkeleton image />
      <div className={skeletonStyle.members}>
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonBlock key={i} className={skeletonStyle.member} />
        ))}
      </div>
    </div>
  );
}
