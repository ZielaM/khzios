// NewsTile Architecture:
// A reusable card component representing a single news article in feeds/grids.
// It relies on centralized utility functions (`resolveTranslation`, `resolveTagName`)
// to decouple layout logic from the complexities of language fallback chains
// (e.g. falling back to EN if RU translation is missing).

import Image from 'next/image';
import { Link } from '@/i18n/routing';
import style from './NewsTile.module.scss';
import clsx from 'clsx';
import DOMPurify from 'isomorphic-dompurify';
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
import { getPhotoUrl } from '@/lib/content-utils';

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

  // Select the first uploaded photo as the thumbnail,
  // or fallback to a static local placeholder image if the article has no photos.
  const thumbnail = getPhotoUrl(news.photos);

  // Extract the most appropriate translation based on the user's locale.
  // The 'isFallback' flag warns us if the content is being displayed in a language
  // different than the user's primary preference.
  const { translation, isFallback } = resolveTranslation(
    news.translations,
    locale
  );

  const title = translation?.title ?? 'Translation missing';
  const content = translation?.content ?? '...';

  // Re-use standard fallback logic for each individual tag
  const getTagName = (tag: Tag & { translations: TagTranslation[] }) =>
    resolveTagName(tag, locale);

  // Use the native Intl API to format dates consistently according to locale rules
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(news.createdAt));

  return (
    <article className={style.newsTile} data-testid="news-tile">
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
          {/* Tag Rendering */}
          <div className={style.tags}>
            {news.tags.map((tag) => (
              <span key={tag.id} className={style.tag}>
                {getTagName(tag)}
              </span>
            ))}
          </div>

          {/* Render an informational badge if the user is seeing fallback content */}
          {isFallback && translation && (
            <span
              className={style.fallbackBadge}
              data-testid="news-fallback-badge"
            >
              {t('translationUnavailable', {
                language:
                  LANGUAGE_NAMES[translation.languageCode] ??
                  translation.languageCode,
              })}
            </span>
          )}

          {/* Search Result Highlighting Logic:
              If the database query included a full-text search, the returned content 
              will contain raw HTML <mark> tags emphasizing the matching query string. 
              We MUST use dangerouslySetInnerHTML to render these. */}
          <h3
            className={style.title}
            data-testid="news-title"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(title, { ALLOWED_TAGS: ['mark'] }),
            }}
          />

          <p
            className={clsx(style.description, {
              [style.highlighted]: content.includes('<mark>'),
            })}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content, { ALLOWED_TAGS: ['mark'] }),
            }}
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
