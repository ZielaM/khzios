import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import NewsSearchForm from '@/components/NewsSearchForm';
import NewsGridServer from '@/components/NewsGrid/NewsGridServer';
import NewsGridSkeleton from '@/components/NewsGrid/NewsGridSkeleton';
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
    typeof resolvedSearchParams.query === 'string'
      ? resolvedSearchParams.query
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
  // To avoid blocking the page for tags fetching, we can fetch them here.
  // Wait, dbTags query is fast, but if it blocks, it blocks the search form.
  const dbTags = await prisma.tag.findMany({ include: { translations: true } });
  const availableTags = dbTags.map((t) => {
    const translation = t.translations.find((tr) => tr.languageCode === locale);
    return {
      value: t.name,
      label: translation?.name || t.name,
    };
  });

  const t = await getTranslations('NewsPage');

  // Klucz dla Suspense, żeby odświeżało się po zmianie parametrów!
  const suspenseKey = JSON.stringify({ query, tag, page, sortBy });

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

      <Suspense key={suspenseKey} fallback={<NewsGridSkeleton />}>
        <NewsGridServer
          query={query}
          locale={locale}
          tag={tag}
          page={page}
          limit={limit}
          sortBy={sortBy}
        />
      </Suspense>
    </main>
  );
}
