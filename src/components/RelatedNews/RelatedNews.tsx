import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { resolveTranslation } from '@/lib/translations';
import { getPhotoUrl, stripHtml } from '@/lib/content-utils';
import { getRelatedNews } from '@/lib/news-queries';
import { ArrowRight } from 'lucide-react';
import style from './RelatedNews.module.scss';

interface RelatedNewsProps {
  newsId: string;
  tagIds: string[];
  locale: string;
}

/**
 * Async server component that fetches and renders a "Read also" section.
 *
 * Designed to be wrapped in <Suspense> so the main article content
 * can stream to the client immediately while this component loads
 * its own data (related articles query) independently.
 */
export default async function RelatedNews({
  newsId,
  tagIds,
  locale,
}: RelatedNewsProps) {
  const [articles, t] = await Promise.all([
    getRelatedNews(newsId, tagIds, 3),
    getTranslations({ locale, namespace: 'NewsDetails' }),
  ]);

  if (articles.length === 0) return null;

  return (
    <section className={style.relatedSection}>
      <h2 className={style.sectionTitle}>{t('relatedArticles')}</h2>
      <div className={style.grid}>
        {articles.map((article) => {
          const { translation } = resolveTranslation(
            article.translations,
            locale
          );
          const title = translation?.title ?? '';
          const cleanTitle = stripHtml(title);
          const photoUrl = getPhotoUrl(article.photos);

          const formattedDate = new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date(article.createdAt));

          return (
            <Link
              key={article.id}
              href={{ pathname: '/news/[id]', params: { id: article.id } }}
              className={style.card}
            >
              <div className={style.cardImage}>
                <Image
                  src={photoUrl}
                  alt={cleanTitle}
                  fill
                  className={style.image}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className={style.cardContent}>
                <span className={style.cardDate}>{formattedDate}</span>
                <h3 className={style.cardTitle}>{cleanTitle}</h3>
                <span className={style.cardLink}>
                  {t('readArticle')}
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
