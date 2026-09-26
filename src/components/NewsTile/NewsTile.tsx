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
import { excerpt, stripHtml } from '@/lib/content-utils';
import { getPhotoAlt, getPhotoUrl } from '@/lib/photos';
import { formatDate } from '@/lib/dates';
import AnimateOnce from '@/components/AnimateOnce';

/**
 * Plain text with only the <mark> highlights added by search. Script and
 * style elements go first, together with their text, before the remaining
 * tags are unwrapped.
 */
function keepMarksOnly(html: string) {
  return DOMPurify.sanitize(
    DOMPurify.sanitize(html, { FORBID_TAGS: ['style', 'script'] }),
    { ALLOWED_TAGS: ['mark'] }
  );
}

export interface NewsTileProps {
  news: NewsWithRelations;
  locale: string;
  /** Preload the image: only for a tile that is the page's largest image */
  preload?: boolean;
  /** Heading level of the title within the page outline */
  headingLevel?: 2 | 3;
}

export default function NewsTile({
  news,
  locale,
  preload = false,
  headingLevel = 3,
}: NewsTileProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const t = useTranslations('HomePage');

  const thumbnail = getPhotoUrl(news.photos);

  // isFallback: the text is in another language than the page
  const { translation, isFallback } = resolveTranslation(
    news.translations,
    locale
  );

  const title = translation?.title ?? '';
  const content = translation?.content ?? '...';

  const cleanTitle = keepMarksOnly(title);

  // Search results carry a short ts_headline snippet with <mark> highlights;
  // regular listings get a plain-text excerpt instead of the whole article.
  const isHighlighted = content.includes('<mark>');
  const description = isHighlighted
    ? keepMarksOnly(content)
    : excerpt(stripHtml(content), 220);

  const getTagName = (tag: NewsWithRelations['tags'][number]) =>
    resolveTagName(tag, locale);

  const formattedDate = formatDate(news.publishedAt, locale);
  // Search results highlight matches with <mark>, which must not leak into alt
  const imageAlt = getPhotoAlt(news.photos[0], locale, stripHtml(title));

  return (
    <AnimateOnce>
      <article className={style.newsTile} data-testid="news-tile">
        <div className={style.imageContainer}>
          <Image
            src={thumbnail}
            alt={imageAlt}
            fill
            preload={preload}
            className={style.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className={style.dateBadge}>
            <time dateTime={news.publishedAt.toISOString()}>
              {formattedDate}
            </time>
          </div>
        </div>

        <div className={style.content}>
          {news.tags.length > 0 && (
            <div className={style.tags}>
              {news.tags.map((tag) => (
                <span key={tag.id} className={style.tag}>
                  {getTagName(tag)}
                </span>
              ))}
            </div>
          )}

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

          {/* Only the title is the link, so its accessible name stays short;
              the link's ::after stretches the click area over the card.
              Search results carry <mark> highlights, hence innerHTML. */}
          <Heading className={style.title} data-testid="news-title">
            <Link
              href={{ pathname: '/news/[id]', params: { id: news.id } }}
              className={style.titleLink}
              dangerouslySetInnerHTML={{ __html: cleanTitle }}
            />
          </Heading>

          {isHighlighted ? (
            <p
              className={clsx(style.description, style.highlighted)}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className={style.description}>{description}</p>
          )}

          <span className={style.readMore} aria-hidden="true">
            {t('readMore')}
            <ArrowRight size={18} />
          </span>
        </div>
      </article>
    </AnimateOnce>
  );
}
