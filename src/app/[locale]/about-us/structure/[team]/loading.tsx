import style from './page.module.scss';
import skeletonStyle from './loading.module.scss';
import fullTeamStyle from '@/components/FullTeamPage/FullTeamPage.module.scss';
import clsx from 'clsx';

export default function Loading() {
  return (
    <div className={style.page}>
      <div className={clsx(skeletonStyle.skeleton, skeletonStyle.backLinkSkeleton)} />

      <div className={fullTeamStyle.fullTeam}>
        <div className={clsx(skeletonStyle.skeleton, skeletonStyle.hero)} />

        <div className={fullTeamStyle.contentGrid}>
          <div className={skeletonStyle.sectionBlock}>
            <div
              className={clsx(
                skeletonStyle.skeleton,
                skeletonStyle.sectionTitle
              )}
            />
            <div className={skeletonStyle.membersGrid}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={clsx(
                    skeletonStyle.skeleton,
                    skeletonStyle.memberCard
                  )}
                />
              ))}
            </div>
          </div>

          <div className={skeletonStyle.sectionBlock}>
            <div
              className={clsx(
                skeletonStyle.skeleton,
                skeletonStyle.sectionTitleWide
              )}
            />
            <div
              className={clsx(skeletonStyle.skeleton, skeletonStyle.paragraph)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
