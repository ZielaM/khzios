import Image from 'next/image';
import Link from 'next/link';
import style from './NewsTile.module.scss';
import { News, Tag, Photo } from '@/generated/prisma/client';
import { ArrowRight } from 'lucide-react';

export interface NewsTileProps {
  news: News & {
    tags: Tag[];
    photos: Photo[];
  };
}

export default function NewsTile({ news }: NewsTileProps) {
  // Wybierz pierwsze zdjęcie jako miniaturę, lub użyj placeholdera
  const thumbnail =
    news.photos.length > 0 ? news.photos[0].url : '/placeholder-news.jpg';

  // Formatowanie daty na polski za pomocą wbudowanego Intl
  const formattedDate = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(news.createdAt));

  return (
    <article className={style.newsTile}>
      <Link href={`/aktualnosci/${news.id}`} className={style.linkWrapper}>
        <div className={style.imageContainer}>
          <Image
            src={thumbnail}
            alt={news.title}
            fill
            className={style.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className={style.dateBadge}>{formattedDate}</div>
        </div>

        <div className={style.content}>
          <div className={style.tags}>
            {news.tags.map((tag) => (
              <span key={tag.id} className={style.tag}>
                {tag.name}
              </span>
            ))}
          </div>

          <h3 className={style.title}>{news.title}</h3>

          <p className={style.description}>{news.content}</p>

          <div className={style.readMore}>
            Czytaj dalej
            <ArrowRight size={18} />
          </div>
        </div>
      </Link>
    </article>
  );
}
