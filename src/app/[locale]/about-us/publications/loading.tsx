import PublicationsSearchForm from '@/components/PublicationsSearchForm';
import PublicationsListSkeleton from '@/components/PublicationsListSkeleton';
import { PageHeaderSkeleton } from '@/components/Skeleton';
import style from './page.module.scss';

export default function Loading() {
  return (
    <div className={style.main} aria-hidden="true">
      <PageHeaderSkeleton />
      <PublicationsSearchForm isSkeleton />
      <PublicationsListSkeleton />
    </div>
  );
}
