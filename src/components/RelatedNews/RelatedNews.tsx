import { getTranslations } from 'next-intl/server';
import NewsListItem from '@/components/NewsListItem';
import { getRelatedNews } from '@/lib/news-queries';
import style from './RelatedNews.module.scss';

interface RelatedNewsProps {
  newsId: string;
  tagIds: string[];
  locale: string;
}

/**
 * "Read also": recent articles sharing a tag. Wrapped in <Suspense> by the
 * article page, so the article streams without waiting for this query.
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
    <section className={style.relatedSection} aria-labelledby="related-news">
      <h2 id="related-news" className={style.sectionTitle}>
        {t('relatedArticles')}
      </h2>
      <div className={style.list}>
        {articles.map((article) => (
          <NewsListItem
            key={article.id}
            news={article}
            locale={locale}
            compact
          />
        ))}
      </div>
    </section>
  );
}
