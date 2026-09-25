import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';
import Image from 'next/image';
import BackLink from '@/components/BackLink';
import style from './page.module.scss';
import DOMPurify from 'isomorphic-dompurify';
import { Calendar, Clock } from 'lucide-react';
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
  estimateReadingTime,
} from '@/lib/content-utils';
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
import AnimateOnce from '@/components/AnimateOnce';
import RelatedNewsSkeleton from '@/components/RelatedNews/RelatedNewsSkeleton';
import { renderOnFirstRequest } from '@/lib/static-params';
import JsonLd from '@/components/JsonLd';

// Articles are cached after their first view and refreshed daily, so an edit
// or unpublication shows up within a day without hitting the database on
// every request.
export const revalidate = 86400;
export const generateStaticParams = renderOnFirstRequest;

// For Next.js dynamic routes, define the expected params interface
interface NewsDetailsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

// Generate SEO Metadata dynamically
export async function generateMetadata({
  params,
}: NewsDetailsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, id } = resolvedParams;

  setRequestLocale(locale);

  // Uses React.cache() — deduplicated with the page component's call
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
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewsDetails' });

  // Uses React.cache() — deduplicated with generateMetadata's call
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

  const mainPhoto = getPhotoUrl(news.photos);
  const mainPhotoAlt = getPhotoAlt(news.photos[0], locale, cleanTitle);
  const readingTime = estimateReadingTime(content);

  // Tag IDs for the Suspense-wrapped RelatedNews component
  const tagIds = news.tags.map((tag) => tag.id);

  // Pass all photos to the gallery
  const galleryPhotos = news.photos;

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
      <ReadingProgress />
      <JsonLd data={jsonLd} />
      <main className={style.pageWrapper}>
        <AnimateOnce className={style.container}>
          <header className={style.header}>
            <div className={style.headerActions}>
              <BackLink href="/news" className={style.backLink}>
                {t('backToNews')}
              </BackLink>
              <ShareButton title={cleanTitle} />
            </div>

            {isFallback && translation && (
              <div className={style.fallbackBanner}>
                {t('translationUnavailable', {
                  language:
                    LANGUAGE_NAMES[translation.languageCode] ??
                    translation.languageCode,
                })}
              </div>
            )}

            <div className={style.metadata}>
              <div className={style.dateWrapper}>
                <Calendar
                  aria-hidden="true"
                  size={18}
                  className={style.metaIcon}
                />
                <time
                  className={style.date}
                  dateTime={news.publishedAt.toISOString()}
                >
                  {t('publishedOn', { date: formattedDate })}
                </time>
              </div>
              <div className={style.readingTimeWrapper}>
                <Clock
                  aria-hidden="true"
                  size={18}
                  className={style.metaIcon}
                />
                <span className={style.readingTime}>
                  {t('readingTime', { minutes: readingTime })}
                </span>
              </div>
              {news.tags.length > 0 && (
                <div className={style.tags}>
                  {news.tags.map((tag) => (
                    <span key={tag.id} className={style.tag}>
                      {resolveTagName(tag, locale)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h1
              className={style.title}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
            />
          </header>

          <section className={style.heroImageContainer}>
            <Image
              src={mainPhoto}
              alt={mainPhotoAlt}
              fill
              priority
              className={style.heroImage}
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className={style.heroGradient} />
          </section>

          <article
            className={style.articleContent}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content, {
                FORBID_TAGS: ['style', 'script'],
              }),
            }}
          />

          {galleryPhotos.length > 0 && (
            <section className={style.gallerySection}>
              <h2 className={style.gallerySectionTitle}>{t('gallery')}</h2>
              <NewsGallery
                photos={galleryPhotos}
                title={cleanTitle}
                locale={locale}
              />
            </section>
          )}

          <Suspense fallback={<RelatedNewsSkeleton />}>
            <RelatedNews newsId={news.id} tagIds={tagIds} locale={locale} />
          </Suspense>
        </AnimateOnce>
      </main>
      <ScrollToTop />
    </>
  );
}
