import Image from 'next/image';
import { Link } from '@/i18n/routing';
import style from './NewsTile.module.scss';
import {
  News,
  Tag,
  Photo,
  NewsTranslation,
  TagTranslation,
} from '@/generated/prisma/client';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface NewsTileProps {
  news: News & {
    tags: (Tag & { translations: TagTranslation[] })[];
    photos: Photo[];
    translations: NewsTranslation[];
  };
  locale: string;
}

// Nazwy języków do wyświetlenia w adnotacji
const LANGUAGE_NAMES: Record<string, string> = {
  pl: 'polski',
  en: 'English',
};

export default function NewsTile({ news, locale }: NewsTileProps) {
  const t = useTranslations('HomePage');

  // Wybierz pierwsze zdjęcie jako miniaturę, lub użyj placeholdera
  const thumbnail =
    news.photos.length > 0 ? news.photos[0].url : '/placeholder-news.jpg';

  // Wybierz odpowiednie tłumaczenie z fallbackiem: locale → en → pl
  const findTranslation = (langCode: string) =>
    news.translations?.find((tr) => tr.languageCode === langCode);

  const localeTranslation = findTranslation(locale);
  const enTranslation = findTranslation('en');
  const plTranslation = findTranslation('pl');

  const translation = localeTranslation ?? enTranslation ?? plTranslation;
  const isFallback = translation && translation.languageCode !== locale;

  const title = translation?.title ?? 'Brak tłumaczenia';
  const content = translation?.content ?? '...';

  // Pobierz przetłumaczoną nazwę tagu (fallback na tag.name)
  const getTagName = (tag: Tag & { translations: TagTranslation[] }) => {
    const tagTranslation = tag.translations?.find(
      (tr) => tr.languageCode === locale
    );
    return tagTranslation?.name ?? tag.name;
  };

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

          {isFallback && (
            <span className={style.fallbackBadge}>
              {t('translationUnavailable', {
                language:
                  LANGUAGE_NAMES[translation.languageCode] ??
                  translation.languageCode,
              })}
            </span>
          )}

          <h3 className={style.title}>{title}</h3>

          <p
            className={style.description}
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
