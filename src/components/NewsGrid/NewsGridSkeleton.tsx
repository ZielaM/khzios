import NewsTileSkeleton from '@/components/NewsTile/NewsTileSkeleton';
import style from '@/app/[locale]/news/page.module.scss';

export default function NewsGridSkeleton() {
  // Wyświetlamy 12 szkieletów jako placeholder dla siatki newsów
  const skeletons = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className={style.newsGrid}>
      {skeletons.map((index) => (
        <NewsTileSkeleton key={index} />
      ))}
    </div>
  );
}
