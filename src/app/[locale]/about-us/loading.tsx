import { PageHeaderSkeleton, SkeletonLines } from '@/components/Skeleton';
import style from './page.module.scss';

export default function Loading() {
  return (
    <div className={style.page} aria-hidden="true">
      <PageHeaderSkeleton image />
      <div className={style.content}>
        <SkeletonLines count={4} />
        <SkeletonLines count={6} />
      </div>
    </div>
  );
}
