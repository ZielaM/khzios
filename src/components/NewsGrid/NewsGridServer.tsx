import { searchPublishedNews } from '@/actions/search';
import NewsGridClient from './NewsGridClient';
import { LanguageCode, SortBy } from '@/types/search-types';

interface NewsGridServerProps {
  query?: string;
  locale: LanguageCode;
  tag?: string;
  page: number;
  sortBy: SortBy;
  dateFrom?: string;
  dateTo?: string;
}

export default async function NewsGridServer({
  query,
  locale,
  tag,
  page,
  sortBy,
  dateFrom,
  dateTo,
}: NewsGridServerProps) {
  const { data, totalPages } = await searchPublishedNews({
    query,
    language: locale,
    tag,
    page,
    sortBy,
    dateFrom,
    dateTo,
  });

  return (
    <NewsGridClient
      initialData={data}
      totalPages={totalPages}
      searchParams={{
        query,
        language: locale,
        tag,
        page,
        sortBy,
        dateFrom,
        dateTo,
      }}
    />
  );
}
