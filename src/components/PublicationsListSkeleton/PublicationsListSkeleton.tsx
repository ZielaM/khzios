import style from '../PublicationsListServer/PublicationsListServer.module.scss';
import skeletonStyle from './PublicationsListSkeleton.module.scss';
import clsx from 'clsx';

export default function PublicationsListSkeleton() {
  const skeletons = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className={style.publicationsList}>
      <div className={style.listContainer}>
        {skeletons.map((index) => (
          <div
            key={index}
            className={clsx(style.publicationItem, skeletonStyle.skeletonItem)}
          >
            <div className={skeletonStyle.skeletonYear}></div>
            <div className={style.itemContent}>
              <div className={skeletonStyle.skeletonTitle}></div>
              <div className={skeletonStyle.skeletonTitleHalf}></div>
              <div className={style.itemMeta}>
                <div className={skeletonStyle.skeletonMeta}></div>
                <div className={skeletonStyle.skeletonMeta}></div>
              </div>
              <div className={style.itemFooter}>
                <div className={skeletonStyle.skeletonLink}></div>
                <div className={skeletonStyle.skeletonLink}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
