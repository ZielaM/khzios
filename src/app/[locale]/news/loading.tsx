import style from './page.module.scss';
import NewsSearchForm from '@/components/NewsSearchForm';
import NewsGridSkeleton from '@/components/NewsGrid/NewsGridSkeleton';

export default function Loading() {
  return (
    <div className={style.main}>
      <div className={style.header}>
        <h1 className={style.title}>...</h1>
      </div>

      {/* Inline styles are used here to avoid adding a new className just for skeleton */}
      <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
        <NewsSearchForm initialSort="relevance" availableTags={[]} />
      </div>

      <NewsGridSkeleton />
    </div>
  );
}
