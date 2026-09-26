import NewsGridSkeleton from '@/components/NewsGrid/NewsGridSkeleton';
import style from './page.module.scss';

// No translations here: loading.tsx gets no params, so next-intl would read
// the locale from the request headers and make every page below dynamic
export default function Loading() {
  return (
    <div className={style.main} aria-hidden="true">
      <div className={style.skeletonHeader}>
        <span className={style.skeletonTitle} />
        <span className={style.skeletonSearch} />
      </div>
      <NewsGridSkeleton />
    </div>
  );
}
