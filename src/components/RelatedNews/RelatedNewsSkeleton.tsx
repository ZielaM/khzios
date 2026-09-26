import style from './RelatedNewsSkeleton.module.scss';

/** Placeholder for the RelatedNews Suspense boundary. */
export default function RelatedNewsSkeleton() {
  return (
    <div className={style.relatedSkeleton} aria-hidden="true">
      <div className={style.title} />
      {[1, 2, 3].map((i) => (
        <div key={i} className={style.row} />
      ))}
    </div>
  );
}
