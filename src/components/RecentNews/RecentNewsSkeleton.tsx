import styles from './RecentNews.module.scss';

export default function RecentNewsSkeleton() {
  return (
    <div className={styles.layout} aria-hidden="true">
      <div className={styles.skeletonLead} />
      <div className={styles.list}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonRow} />
        ))}
      </div>
    </div>
  );
}
