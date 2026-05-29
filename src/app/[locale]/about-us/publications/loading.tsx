import style from './page.module.scss';
import PublicationsSearchForm from '@/components/PublicationsSearchForm';
import PublicationsListSkeleton from '@/components/PublicationsListSkeleton';

export default function Loading() {
  return (
    <div className={style.main}>
      <div className={style.header}>
        <h1 className={style.title}>...</h1>
      </div>

      {/* Inline styles to reduce opacity during initial soft-load */}
      <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
        <PublicationsSearchForm isSkeleton={true} />
      </div>

      <PublicationsListSkeleton />
    </div>
  );
}
