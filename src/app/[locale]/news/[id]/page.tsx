import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import style from './page.module.scss';
import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import {
  resolveTranslation,
  resolveTagName,
  LANGUAGE_NAMES,
} from '@/lib/translations';
import { getPhotoUrl, stripHtml, estimateReadingTime } from '@/lib/photos';
import { getNewsById, getRelatedNews } from '@/lib/news-queries';
import NewsGallery from '@/components/NewsGallery/NewsGallery';
import ShareButton from '@/components/ShareButton/ShareButton';
import RelatedNews from '@/components/RelatedNews/RelatedNews';
import ReadingProgress from '@/components/ReadingProgress/ReadingProgress';
import ScrollToTop from '@/components/ScrollToTop/ScrollToTop';

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

  // Uses React.cache() — deduplicated with the page component's call
  const news = await getNewsById(id);

  if (!news) {
    const t = await getTranslations({ locale, namespace: 'NewsDetails' });
    return { title: t('notFoundTitle') };
  }

  const { translation } = resolveTranslation(news.translations, locale);
  const title = translation?.title ?? 'KHZIOS';
  const rawDescription = translation?.content
    ? translation.content.substring(0, 150) + '...'
    : '';

  // Use stripHtml for clean plain-text stripping via DOMPurify
  const description = stripHtml(rawDescription);
  const imageUrl = getPhotoUrl(news.photos);

  return {
    title,
    description,
    openGraph: {
      title: stripHtml(title),
      description,
      images: [imageUrl],
    },
  };
}

export default async function NewsDetailsPage({
  params,
}: NewsDetailsPageProps) {
  const resolvedParams = await params;
  const { locale, id } = resolvedParams;
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

  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(news.createdAt));

  const mainPhoto = getPhotoUrl(news.photos);
  const readingTime = estimateReadingTime(content);

  // Fetch related articles (shares at least one tag)
  const tagIds = news.tags.map((tag) => tag.id);
  const relatedArticles = await getRelatedNews(news.id, tagIds, 3);

  // Pass all photos to the gallery
  const galleryPhotos = news.photos;

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: cleanTitle,
    datePublished: news.createdAt.toISOString(),
    dateModified: news.updatedAt.toISOString(),
    image: mainPhoto,
    author: {
      '@type': 'Organization',
      name: 'Katedra Hodowli Zwierząt i Oceny Surowców',
      url: 'https://khzios.up.poznan.pl',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Uniwersytet Przyrodniczy w Poznaniu',
    },
  };

  return (
    <>
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={style.pageWrapper}>
        <div className={style.container}>
          <header className={style.header}>
            <div className={style.headerActions}>
              <Link href="/news" className={style.backLink}>
                <ArrowLeft size={18} aria-hidden="true" />
                <span>{t('backToNews')}</span>
              </Link>
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
                  size={18}
                  aria-hidden="true"
                  className={style.metaIcon}
                />
                <time
                  className={style.date}
                  dateTime={news.createdAt.toISOString()}
                >
                  {t('publishedOn', { date: formattedDate })}
                </time>
              </div>
              <div className={style.readingTimeWrapper}>
                <Clock
                  size={18}
                  aria-hidden="true"
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
              alt={cleanTitle}
              fill
              priority
              className={style.heroImage}
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className={style.heroGradient} />
          </section>

          <article
            className={style.articleContent}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />

          {galleryPhotos.length > 0 && (
            <section className={style.gallerySection}>
              <h2 className={style.gallerySectionTitle}>{t('gallery')}</h2>
              <NewsGallery photos={galleryPhotos} />
            </section>
          )}

          <RelatedNews articles={relatedArticles} locale={locale} />
        </div>
      </main>
      <ScrollToTop />
    </>
  );
}
