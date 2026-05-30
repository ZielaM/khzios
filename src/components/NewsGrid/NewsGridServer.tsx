import { searchPublishedNews } from '@/actions/search';
import NewsTile from '@/components/NewsTile';
import Pagination from '@/components/Pagination';
import style from '@/app/[locale]/news/page.module.scss';
import { SearchX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { LanguageCode, SortBy } from '@/types/search-types';

interface NewsGridServerProps {
  query?: string;
  locale: LanguageCode;
  tag?: string;
  page: number;
  limit: number;
  sortBy: SortBy;
}

export default async function NewsGridServer({
  query,
  locale,
  tag,
  page,
  limit,
  sortBy,
}: NewsGridServerProps) {
  const { data, totalPages } = await searchPublishedNews({
    query,
    language: locale,
    tag,
    page,
    limit,
    sortBy,
  });

  const t = await getTranslations('NewsPage');

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
            <NewsTile
              key={item.id}
              news={item}
              locale={locale}
              priority={index < 4}
            />
          ))
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </>
  );
}
