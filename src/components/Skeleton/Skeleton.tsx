import clsx from 'clsx';
import style from './Skeleton.module.scss';

// Placeholders for loading.tsx files. They take no text on purpose:
// loading files get no params, and next-intl would then read the locale from
// the request headers, which makes every page below them dynamic.

/** A grey block; size it with a className from the page. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <span className={clsx(style.block, className)} />;
}

/** Lines of text, the last one shorter. */
export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <span className={style.lines}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={style.line} />
      ))}
    </span>
  );
}

/** Same shape as PageHeader: breadcrumbs, title, lead and optional photo. */
export function PageHeaderSkeleton({
  breadcrumbs = true,
  lead = true,
  image = false,
}: {
  breadcrumbs?: boolean;
  lead?: boolean;
  image?: boolean;
}) {
  return (
    <div className={style.header} aria-hidden="true">
      {breadcrumbs && <span className={clsx(style.block, style.crumbs)} />}
      <div className={clsx(style.headerBody, image && style.withImage)}>
        <div>
          <span className={clsx(style.block, style.title)} />
          {lead && <SkeletonLines count={2} />}
        </div>
        {image && <span className={clsx(style.block, style.image)} />}
      </div>
    </div>
  );
}
