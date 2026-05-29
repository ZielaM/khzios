import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';
import clsx from 'clsx';

export default function Loading() {
  const managementSkeletons = Array.from({ length: 2 });
  const teamSkeletons = Array.from({ length: 9 });

  return (
    <div className={style.page}>
      <div
        className={clsx(skeletonStyle.skeleton, skeletonStyle.backLinkSkeleton)}
      />

      <section
        className={clsx(
          style.hero,
          skeletonStyle.skeleton,
          skeletonStyle.heroSkeleton
        )}
      />

      <div
        className={clsx(
          skeletonStyle.skeleton,
          skeletonStyle.sectionTitleSkeleton
        )}
      />

      <div className={style.managementGrid}>
        {managementSkeletons.map((_, i) => (
          <div
            key={i}
            className={clsx(skeletonStyle.card, skeletonStyle.skeleton)}
          />
        ))}
      </div>

      <div
        className={clsx(
          skeletonStyle.skeleton,
          skeletonStyle.sectionTitleSkeleton
        )}
      />

      <div className={style.teamsSection}>
        <div className={style.teamsGrid}>
          {teamSkeletons.map((_, i) => (
            <div
              key={i}
              className={clsx(
                skeletonStyle.card,
                skeletonStyle.skeleton,
                skeletonStyle.teamCardSkeleton
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
