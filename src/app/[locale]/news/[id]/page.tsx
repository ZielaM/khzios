import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import Image from 'next/image';
import Breadcrumbs from '@/components/Breadcrumbs';
import style from './page.module.scss';
import DOMPurify from 'isomorphic-dompurify';
import {
  resolveTranslation,
  resolveTagName,
  LANGUAGE_NAMES,
} from '@/lib/translations';
import {
  estimateReadingTime,
  excerpt,
  sanitizeInlineHtml,
  stripHtml,
} from '@/lib/content-utils';
import { getPhotoAlt } from '@/lib/photos';
import { formatDate } from '@/lib/dates';
import { getNewsById } from '@/lib/news-queries';
import {
  DEFAULT_OG_IMAGE,
  LOGO_IMAGE,
  pageMetadata,
  toAbsoluteUrl,
} from '@/lib/seo';
import { getPathname } from '@/i18n/routing';
import NewsGallery from '@/components/NewsGallery/NewsGallery';
import ShareButton from '@/components/ShareButton/ShareButton';
import RelatedNews from '@/components/RelatedNews/RelatedNews';
import ReadingProgress from '@/components/ReadingProgress/ReadingProgress';
import ScrollToTop from '@/components/ScrollToTop/ScrollToTop';
import RelatedNewsSkeleton from '@/components/RelatedNews/RelatedNewsSkeleton';
import { renderOnFirstRequest } from '@/lib/static-params';
import JsonLd from '@/components/JsonLd';
import { setPageLocale } from '@/i18n/page-locale';

// Articles are cached after their first view and refreshed daily, so an edit
// or unpublication shows up within a day without hitting the database on
// every request.
export const revalidate = 86400;
export const generateStaticParams = renderOnFirstRequest;

// Reading time and the progress bar only help with longer texts
const LONG_READ_MINUTES = 5;

interface NewsDetailsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: NewsDetailsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, id } = resolvedParams;

  setPageLocale(locale);

  // getNewsById is wrapped in React.cache(): the page reuses this query
  const news = await getNewsById(id);

  if (!news) {
    const t = await getTranslations({ locale, namespace: 'NewsDetails' });
    return { title: t('notFoundTitle') };
  }

  const { translation } = resolveTranslation(news.translations, locale);
  // Titles may contain inline HTML; metadata needs plain text
  const title = stripHtml(translation?.title ?? '') || undefined;
  const mainPhoto = news.photos[0];

  return pageMetadata({
    locale,
    href: { pathname: '/news/[id]', params: { id } },
    title,
    description: excerpt(stripHtml(translation?.content ?? ''), 155),
    // Articles without photos use the site's default share image
    image: mainPhoto
      ? { src: mainPhoto.url, alt: getPhotoAlt(mainPhoto, locale, title ?? '') }
      : null,
  });
}

export default async function NewsDetailsPage({
  params,
}: NewsDetailsPageProps) {
  const resolvedParams = await params;
  const { locale, id } = resolvedParams;
  setPageLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewsDetails' });

  const news = await getNewsById(id);

  if (!news) {
    notFound();
  }

  const { translation, isFallback } = resolveTranslation(
    news.translations,
    locale
  );

  const title = translation?.title ?? t('notFoundTitle');
  const content = translation?.content ?? t('notFoundDesc');
  const cleanTitle = stripHtml(title);

  const formattedDate = formatDate(news.publishedAt, locale);

  const leadPhoto = news.photos[0];
  const readingTime = estimateReadingTime(content);
  const tagIds = news.tags.map((tag) => tag.id);
  const tNav = await getTranslations({ locale, namespace: 'Navbar' });

  const tHome = await getTranslations({ locale, namespace: 'HomePage' });
  const articleUrl = toAbsoluteUrl(
    getPathname({ locale, href: { pathname: '/news/[id]', params: { id } } })
  );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: cleanTitle,
    description: excerpt(stripHtml(content), 200),
    inLanguage: translation?.languageCode ?? locale,
    mainEntityOfPage: articleUrl,
    datePublished: news.publishedAt.toISOString(),
    dateModified: news.updatedAt.toISOString(),
    image: toAbsoluteUrl(news.photos[0]?.url ?? DEFAULT_OG_IMAGE),
    author: {
      '@type': 'Organization',
      name: tHome('heroTitle'),
      url: toAbsoluteUrl(getPathname({ locale, href: '/' })),
    },
    publisher: {
      '@type': 'Organization',
      name: tHome('heroTitle'),
      logo: { '@type': 'ImageObject', url: toAbsoluteUrl(LOGO_IMAGE) },
    },
  };

  return (
    <>
      {readingTime >= LONG_READ_MINUTES && <ReadingProgress />}
      <JsonLd data={jsonLd} />
      {/* The layout provides the page's <main> landmark */}
      <div className={style.page}>
        <Breadcrumbs
          items={[{ label: tNav('news'), href: '/news' }]}
          current={cleanTitle}
        />

        <article className={style.article}>
          <header className={style.header}>
            <h1
              className={style.title}
              dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(title) }}
            />
            <div className={style.meta}>
              <time dateTime={news.publishedAt.toISOString()}>
                {formattedDate}
              </time>
              {readingTime >= LONG_READ_MINUTES && (
                <span>{t('readingTime', { minutes: readingTime })}</span>
              )}
              {news.tags.length > 0 && (
                <ul className={style.tags}>
                  {news.tags.map((tag) => (
                    <li key={tag.id}>{resolveTagName(tag, locale)}</li>
                  ))}
                </ul>
              )}
              <ShareButton title={cleanTitle} />
            </div>
            {isFallback && translation && (
              <p className={style.fallbackNotice}>
                {t('translationUnavailable', {
                  language:
                    LANGUAGE_NAMES[translation.languageCode] ??
                    translation.languageCode,
                })}
              </p>
            )}
          </header>

          {leadPhoto && (
            <div className={style.leadPhoto}>
              <Image
                src={leadPhoto.url}
                alt={getPhotoAlt(leadPhoto, locale, cleanTitle)}
                fill
                preload
                sizes="(max-width: 1024px) 100vw, 976px"
              />
            </div>
          )}

          <div
            className={style.content}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content, {
                FORBID_TAGS: ['style', 'script'],
              }),
            }}
          />

          {/* The first photo is already shown above the text */}
          {news.photos.length > 1 && (
            <section className={style.gallerySection}>
              <h2 className={style.gallerySectionTitle}>{t('gallery')}</h2>
              <NewsGallery
                photos={news.photos}
                title={cleanTitle}
                locale={locale}
              />
            </section>
          )}
        </article>

        <Suspense fallback={<RelatedNewsSkeleton />}>
          <RelatedNews newsId={news.id} tagIds={tagIds} locale={locale} />
        </Suspense>
      </div>
      <ScrollToTop />
    </>
  );
}
