import { PageHeaderSkeleton, SkeletonBlock } from '@/components/Skeleton';
import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';

export default function Loading() {
  return (
    <div className={style.page} aria-hidden="true">
      <PageHeaderSkeleton />
      <div className={style.teamsGrid}>
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonBlock key={i} className={skeletonStyle.teamCard} />
        ))}
      </div>
      <div className={style.managementGrid}>
        <SkeletonBlock className={skeletonStyle.headCard} />
      </div>
    </div>
  );
}
