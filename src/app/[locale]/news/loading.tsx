import style from './page.module.scss';
import NewsSearchForm from '@/components/NewsSearchForm';
import NewsGridSkeleton from '@/components/NewsGrid/NewsGridSkeleton';

export default function Loading() {
  return (
    <div className={style.main}>
      <div className={style.topBar}>
        <div
          style={{
            opacity: 0.5,
            pointerEvents: 'none',
            width: '150px',
            height: '40px',
            background: 'rgba(0,0,0,0.05)',
            borderRadius: '8px',
          }}
        />

        {/* Inline styles are used here to avoid adding a new className just for skeleton */}
        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <NewsSearchForm
            initialSort="relevance"
            availableTags={[]}
            isSkeleton={true}
          />
        </div>
      </div>

      <NewsGridSkeleton />
    </div>
  );
}
