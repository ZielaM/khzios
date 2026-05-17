import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import style from './page.module.scss';
import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft } from 'lucide-react';
import { resolveTranslation, resolveTagName, LANGUAGE_NAMES } from '@/lib/translations';

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

  const news = await prisma.news.findUnique({
    where: { id, published: true },
    include: {
      translations: true,
      photos: true,
    },
  });

  if (!news) {
    const t = await getTranslations({ locale, namespace: 'NewsDetails' });
    return { title: t('notFoundTitle') };
  }

  const { translation } = resolveTranslation(news.translations, locale);
  const title = translation?.title ?? 'KHZIOS';
  const description = translation?.content
    ? translation.content.substring(0, 150) + '...'
    : '';

  const imageUrl =
    news.photos.length > 0 ? news.photos[0].url : '/placeholder-news.jpg';

  return {
    title,
    description: description.replace(/<[^>]*>?/gm, ''), // Strip HTML for meta description
    openGraph: {
      title,
      description: description.replace(/<[^>]*>?/gm, ''),
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

  // Fetch the specific news article with all relations
  const news = await prisma.news.findUnique({
    where: { id, published: true },
    include: {
      translations: true,
      tags: {
        include: {
          translations: true,
        },
      },
      photos: true,
    },
  });

  if (!news) {
    notFound();
  }

  const { translation, isFallback } = resolveTranslation(
    news.translations,
    locale
  );

  const title = translation?.title ?? t('notFoundTitle');
  const content = translation?.content ?? t('notFoundDesc');

  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(news.createdAt));

  const mainPhoto =
    news.photos.length > 0 ? news.photos[0].url : '/placeholder-news.jpg';

  // Pass all photos to the gallery
  const galleryPhotos = news.photos;

  return (
    <main className={style.pageWrapper}>
      <div className={style.container}>
        <header className={style.header}>
          <Link href="/news" className={style.backLink}>
            <ArrowLeft size={20} aria-hidden="true" />
            <span>{t('backToNews')}</span>
          </Link>

          {isFallback && translation && (
            <div className={style.fallbackBanner}>
              {t('translationUnavailable', {
                language:
                  LANGUAGE_NAMES[translation.languageCode] ??
                  translation.languageCode,
              })}
            </div>
          )}

          <h1
            className={style.title}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title) }}
          />

          <div className={style.metadata}>
            <time className={style.date} dateTime={news.createdAt.toISOString()}>
              {t('publishedOn', { date: formattedDate })}
            </time>
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
        </header>

        <section className={style.heroImageContainer}>
          <Image
            src={mainPhoto}
            alt={title.replace(/<[^>]*>?/gm, '')} // Clean alt text
            fill
            priority
            className={style.heroImage}
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
        </section>

        <article
          className={style.articleContent}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />

        {galleryPhotos.length > 0 && (
          <section className={style.gallery}>
            {galleryPhotos.map((photo, index) => (
              <div key={photo.id} className={style.galleryImageWrapper}>
                <Image
                  src={photo.url}
                  alt={`Gallery image ${index + 1}`}
                  fill
                  className={style.galleryImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
