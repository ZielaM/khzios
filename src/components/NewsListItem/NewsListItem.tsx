import Image from 'next/image';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import type { NewsWithRelations } from '@/lib/news-queries';
import { excerpt, keepMarksOnly, stripHtml } from '@/lib/content-utils';
import { formatDate } from '@/lib/dates';
import {
  LANGUAGE_NAMES,
  resolveTagName,
  resolveTranslation,
} from '@/lib/translations';
import style from './NewsListItem.module.scss';

interface NewsListItemProps {
  news: NewsWithRelations;
  locale: string;
  headingLevel?: 2 | 3;
  /** Larger variant with the photo above the text (home page lead story) */
  featured?: boolean;
  /** Narrow variant: one sentence, no tags, small thumbnail */
  compact?: boolean;
  /** Preload the photo: only for the page's largest image */
  preload?: boolean;
}

/**
 * One article in a list: date, title, a sentence or two and the tags, with
 * a thumbnail only when the article has a photo. The title is the only
 * link; its ::after covers the item so the whole row is clickable.
 */
export default function NewsListItem({
  news,
  locale,
  headingLevel = 3,
  featured = false,
  compact = false,
  preload = false,
}: NewsListItemProps) {
  const t = useTranslations('HomePage');
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const { translation, isFallback } = resolveTranslation(
    news.translations,
    locale
  );

  const title = translation?.title ?? '';
  const content = translation?.content ?? '';
  // Search results carry a short ts_headline fragment with <mark> highlights
  const isHighlighted = content.includes('<mark>');
  const summary = isHighlighted
    ? keepMarksOnly(content)
    : excerpt(stripHtml(content), featured ? 240 : compact ? 110 : 180);
  const photo = news.photos[0];

  return (
    <article
      className={clsx(
        style.item,
        featured && style.featured,
        compact && style.compact
      )}
    >
      {photo && (
        <div className={style.thumb}>
          {/* Decorative: the title next to it is the link */}
          <Image
            src={photo.url}
            alt=""
            fill
            preload={preload}
            sizes={
              featured
                ? '(max-width: 768px) 100vw, 560px'
                : '(max-width: 768px) 100vw, 180px'
            }
          />
        </div>
      )}
      <div className={style.body}>
        <p className={style.meta}>
          <time dateTime={new Date(news.publishedAt).toISOString()}>
            {formatDate(news.publishedAt, locale)}
          </time>
          {isFallback && translation && (
            <span className={style.fallback}>
              {t('translationUnavailable', {
                language:
                  LANGUAGE_NAMES[translation.languageCode] ??
                  translation.languageCode,
              })}
            </span>
          )}
        </p>
        <Heading className={style.title}>
          <Link
            href={{ pathname: '/news/[id]', params: { id: news.id } }}
            className={style.link}
            dangerouslySetInnerHTML={{ __html: keepMarksOnly(title) }}
          />
        </Heading>
        {isHighlighted ? (
          <p
            className={style.summary}
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        ) : (
          summary && <p className={style.summary}>{summary}</p>
        )}
        {!compact && news.tags.length > 0 && (
          <ul className={style.tags}>
            {news.tags.map((tag) => (
              <li key={tag.id}>{resolveTagName(tag, locale)}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
