import style from './NewsGrid.module.scss';

export default function NewsGridSkeleton() {
  return (
    <div className={style.newsGrid} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className={style.skeletonRow}>
          <div className={style.skeletonText}>
            <span className={style.skeletonDate} />
            <span className={style.skeletonTitle} />
            <span className={style.skeletonLine} />
            <span className={style.skeletonLine} />
          </div>
          <span className={style.skeletonThumb} />
        </div>
      ))}
    </div>
  );
}
