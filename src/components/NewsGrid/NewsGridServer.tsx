import { getTranslations } from 'next-intl/server';
import { SearchX } from 'lucide-react';
import { searchNews } from '@/lib/search/news';
import NewsListItem from '@/components/NewsListItem';
import Pagination from '@/components/Pagination';
import type { LanguageCode, SortBy } from '@/types/search-types';
import style from './NewsGrid.module.scss';

interface NewsGridServerProps {
  locale: LanguageCode;
  /** Localized path of the news listing, used for pagination links */
  pathname: string;
  query?: string;
  tag?: string;
  page: number;
  sortBy: SortBy;
  dateFrom?: string;
  dateTo?: string;
}

export default async function NewsGridServer({
  locale,
  pathname,
  query,
  tag,
  page,
  sortBy,
  dateFrom,
  dateTo,
}: NewsGridServerProps) {
  const [{ data, totalPages }, t] = await Promise.all([
    searchNews({
      query,
      language: locale,
      tag,
      page,
      sortBy,
      dateFrom,
      dateTo,
    }),
    getTranslations('NewsPage'),
  ]);

  return (
    <>
      <div className={style.newsGrid}>
        {data.length === 0 ? (
          <div className={style.noResults}>
            <SearchX
              aria-hidden="true"
              className={style.noResultsIcon}
              size={48}
            />
            <p>{t('noResults')}</p>
          </div>
        ) : (
          data.map((item, index) => (
            <NewsListItem
              key={item.id}
              news={item}
              locale={locale}
              headingLevel={2}
              // The first thumbnail is the listing's largest image
              preload={index === 0}
            />
          ))
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pathname={pathname}
        params={{
          query,
          tag,
          // Matches computeNextSearchParams: only relevance is written to the URL
          sort: sortBy === 'relevance' ? 'relevance' : undefined,
          dateFrom,
          dateTo,
        }}
      />
    </>
  );
}
