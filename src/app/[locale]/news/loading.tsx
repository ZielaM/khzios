import NewsGridSkeleton from '@/components/NewsGrid/NewsGridSkeleton';
import { PageHeaderSkeleton, SkeletonBlock } from '@/components/Skeleton';
import style from './page.module.scss';

export default function Loading() {
  return (
    <div className={style.main} aria-hidden="true">
      <PageHeaderSkeleton lead={false} />
      <SkeletonBlock className={style.skeletonSearch} />
      <NewsGridSkeleton />
    </div>
  );
}
