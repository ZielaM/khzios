import { getTranslations } from 'next-intl/server';
import { SearchX } from 'lucide-react';
import { searchPublishedNews } from '@/actions/search';
import { prisma } from '@/lib/prisma';
import NewsTile from '@/components/NewsTile';
import NewsSearchForm from '@/components/NewsSearchForm';
import Pagination from '@/components/Pagination';
import style from './page.module.scss';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}

export default async function NewsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as 'pl' | 'en' | 'uk' | 'ru';

  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams.szukaj === 'string'
      ? resolvedSearchParams.szukaj
      : undefined;
  const tag =
    typeof resolvedSearchParams.tag === 'string'
      ? resolvedSearchParams.tag
      : undefined;
  const page =
    typeof resolvedSearchParams.page === 'string'
      ? parseInt(resolvedSearchParams.page, 10)
      : 1;
  const sortBy =
    typeof resolvedSearchParams.sort === 'string' &&
    ['date', 'relevance'].includes(resolvedSearchParams.sort)
      ? (resolvedSearchParams.sort as 'date' | 'relevance')
      : 'relevance';

  const limit = 12;

  // Fetch all tags for the dropdown
  const dbTags = await prisma.tag.findMany({ include: { translations: true } });
  const availableTags = dbTags.map((t) => {
    const translation = t.translations.find((tr) => tr.languageCode === locale);
    return {
      value: t.name,
      label: translation?.name || t.name,
    };
  });

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
    <main className={style.main}>
      <div className={style.header}>
        <h1 className={style.title}>{t('title')}</h1>
      </div>

      <NewsSearchForm
        initialQuery={query}
        initialTag={tag}
        initialSort={sortBy}
        availableTags={availableTags}
      />


      <div className={style.newsGrid}>
        {data.length === 0 ? (
          <div className={style.noResults}>
            <SearchX className={style.noResultsIcon} size={48} aria-hidden="true" />
            <p>{t('noResults')}</p>
          </div>
        ) : (
          data.map((item) => (
            <NewsTile key={item.id} news={item} locale={locale} />
          ))
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </main>
  );
}
