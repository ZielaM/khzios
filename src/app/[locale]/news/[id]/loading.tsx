import style from './page.module.scss';

export default function Loading() {
  return (
    <div className={style.page} aria-hidden="true">
      <div className={style.article}>
        <div className={style.header}>
          <div className={style.skeletonTitle} />
          <div className={style.skeletonTitle} />
        </div>
        <div className={style.skeletonPhoto} />
        <div className={style.content}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={style.skeletonLine} />
          ))}
        </div>
      </div>
    </div>
  );
}
