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
import type { NewsWithRelations } from '@/lib/news-queries';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  resolveTranslation,
  resolveTagName,
  LANGUAGE_NAMES,
} from '@/lib/translations';
import {
  excerpt,
  getPhotoAlt,
  getPhotoUrl,
  stripHtml,
} from '@/lib/content-utils';
import { formatDate } from '@/lib/dates';
import AnimateOnce from '@/components/AnimateOnce';

export interface NewsTileProps {
  news: NewsWithRelations;
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

  // 2-pass sanitization to safely remove <style>/<script> contents without regex:
  // Pass 1: Remove forbidden tags completely (including their text content).
  // Pass 2: Strip all remaining HTML tags except <mark>.
  const cleanTitle = DOMPurify.sanitize(
    DOMPurify.sanitize(title, { FORBID_TAGS: ['style', 'script'] }),
    { ALLOWED_TAGS: ['mark'] }
  );

  // Search results carry a short ts_headline snippet with <mark> highlights;
  // regular listings get a plain-text excerpt instead of the whole article.
  const isHighlighted = content.includes('<mark>');
  const description = isHighlighted
    ? DOMPurify.sanitize(
        DOMPurify.sanitize(content, { FORBID_TAGS: ['style', 'script'] }),
        { ALLOWED_TAGS: ['mark'] }
      )
    : excerpt(stripHtml(content), 220);

  // Re-use standard fallback logic for each individual tag
  const getTagName = (tag: NewsWithRelations['tags'][number]) =>
    resolveTagName(tag, locale);

  const formattedDate = formatDate(news.publishedAt, locale);
  // Search results highlight matches with <mark>, which must not leak into alt
  const imageAlt = getPhotoAlt(news.photos[0], locale, stripHtml(title));

  return (
    <AnimateOnce>
      <article className={style.newsTile} data-testid="news-tile">
        <Link
          href={{ pathname: '/news/[id]', params: { id: news.id } }}
          className={style.linkWrapper}
        >
          <div className={style.imageContainer}>
            <Image
              src={thumbnail}
              alt={imageAlt}
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
              dangerouslySetInnerHTML={{ __html: cleanTitle }}
            />

            {isHighlighted ? (
              <p
                className={clsx(style.description, style.highlighted)}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className={style.description}>{description}</p>
            )}

            <div className={style.readMore}>
              {t('readMore')}
              <ArrowRight aria-hidden="true" size={18} />
            </div>
          </div>
        </Link>
      </article>
    </AnimateOnce>
  );
}
