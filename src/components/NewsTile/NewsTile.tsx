import Image from 'next/image';
import { Link } from '@/i18n/routing';
import style from './NewsTile.module.scss';
import clsx from 'clsx';
import {
  News,
  Tag,
  Photo,
  NewsTranslation,
  TagTranslation,
} from '@/generated/prisma/client';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  resolveTranslation,
  resolveTagName,
  LANGUAGE_NAMES,
} from '@/lib/translations';

export interface NewsTileProps {
  news: News & {
    tags: (Tag & { translations: TagTranslation[] })[];
    photos: Photo[];
    translations: NewsTranslation[];
  };
  locale: string;
  priority?: boolean;
}

export default function NewsTile({
  news,
  locale,
  priority = false,
}: NewsTileProps) {
  const t = useTranslations('HomePage');

  // Wybierz pierwsze zdjęcie jako miniaturę, lub użyj placeholdera
  const thumbnail =
    news.photos.length > 0 ? news.photos[0].url : '/placeholder-news.jpg';

  // Rozwiąż tłumaczenie dla tego konkretnego newsa (z fallbackiem)
  const { translation, isFallback } = resolveTranslation(
    news.translations,
    locale
  );

  const title = translation?.title ?? 'Brak tłumaczenia';
  const content = translation?.content ?? '...';

  // Pobierz przetłumaczoną nazwę tagu (z pełnym fallbackiem per-tag)
  const getTagName = (tag: Tag & { translations: TagTranslation[] }) =>
    resolveTagName(tag, locale);

  // Formatowanie daty odpowiednio do języka
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(news.createdAt));

  return (
    <article className={style.newsTile}>
      <Link
        href={{ pathname: '/news/[id]', params: { id: news.id } }}
        className={style.linkWrapper}
      >
        <div className={style.imageContainer}>
          <Image
            src={thumbnail}
            alt={title}
            fill
            priority={priority}
            className={style.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className={style.dateBadge}>{formattedDate}</div>
        </div>

        <div className={style.content}>
          <div className={style.tags}>
            {news.tags.map((tag) => (
              <span key={tag.id} className={style.tag}>
                {getTagName(tag)}
              </span>
            ))}
          </div>

          {isFallback && translation && (
            <span className={style.fallbackBadge}>
              {t('translationUnavailable', {
                language:
                  LANGUAGE_NAMES[translation.languageCode] ??
                  translation.languageCode,
              })}
            </span>
          )}

          {title.includes('<mark>') ? (
            <h3
              className={style.title}
              dangerouslySetInnerHTML={{ __html: title }}
            />
          ) : (
            <h3 className={style.title}>{title}</h3>
          )}

          <p
            className={clsx(style.description, {
              [style.highlighted]: content.includes('<mark>'),
            })}
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <div className={style.readMore}>
            {t('readMore')}
            <ArrowRight size={18} aria-hidden="true" />
          </div>
        </div>
      </Link>
    </article>
  );
}
