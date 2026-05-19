import style from './page.module.scss';

/**
 * Route-level loading skeleton for the article detail page.
 * Shown by Next.js during navigation to /news/[id].
 * Mirrors the exact layout of the real page to prevent layout shift.
 */
export default function Loading() {
  return (
    <main className={style.pageWrapper}>
      <div className={style.container}>
        {/* Header skeleton */}
        <header className={style.header}>
          <div className={style.headerActions}>
            <div className={style.skeletonPill} />
            <div className={style.skeletonPillSmall} />
          </div>

          <div className={style.metadata}>
            <div className={style.skeletonLine} style={{ width: '200px' }} />
            <div className={style.skeletonLine} style={{ width: '120px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className={style.skeletonTag} />
              <div className={style.skeletonTag} />
            </div>
          </div>

          {/* Title skeleton — two lines */}
          <div className={style.skeletonTitleLine} />
          <div className={style.skeletonTitleLineShort} />
        </header>

        {/* Hero image skeleton */}
        <div className={style.skeletonHero} />

        {/* Article content skeleton — multiple paragraph lines */}
        <div className={style.skeletonContent}>
          <div className={style.skeletonLine} />
          <div className={style.skeletonLine} />
          <div className={style.skeletonLineShort} />
          <div className={style.skeletonLineSpacer} />
          <div className={style.skeletonLine} />
          <div className={style.skeletonLine} />
          <div className={style.skeletonLine} />
          <div className={style.skeletonLineShort} />
          <div className={style.skeletonLineSpacer} />
          <div className={style.skeletonLine} />
          <div className={style.skeletonLine} />
          <div className={style.skeletonLineShort} />
        </div>
      </div>
    </main>
  );
}
