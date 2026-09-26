import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import NewsSearchForm from '@/components/NewsSearchForm';
import NewsGridServer from '@/components/NewsGrid/NewsGridServer';
import NewsGridSkeleton from '@/components/NewsGrid/NewsGridSkeleton';
import { resolveTagName } from '@/lib/translations';
import { getPathname } from '@/i18n/routing';
import { SortBy } from '@/types/search-types';
import style from './page.module.scss';

import { Metadata } from 'next';
import { listingMetadata } from '@/lib/seo';
import { setPageLocale } from '@/i18n/page-locale';
import PageHeader from '@/components/PageHeader';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setPageLocale(locale);

  const t = await getTranslations({ locale, namespace: 'NewsPage' });
  return listingMetadata({
    locale,
    pathname: '/news',
    searchParams: await searchParams,
    title: t('title'),
    description: t('metaDescription'),
  });
}

export default async function NewsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const locale = setPageLocale(resolvedParams.locale);

  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams.query === 'string'
      ? resolvedSearchParams.query
      : undefined;
  const tag =
    typeof resolvedSearchParams.tag === 'string'
      ? resolvedSearchParams.tag
      : undefined;
  const parsedPage =
    typeof resolvedSearchParams.page === 'string'
      ? parseInt(resolvedSearchParams.page, 10)
      : NaN;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;
  // The search form only writes `sort=relevance`; no parameter means newest first
  const sortBy: SortBy =
    resolvedSearchParams.sort === 'relevance' ? 'relevance' : 'date';

  const dateFrom =
    typeof resolvedSearchParams.dateFrom === 'string'
      ? resolvedSearchParams.dateFrom
      : undefined;

  const dateTo =
    typeof resolvedSearchParams.dateTo === 'string'
      ? resolvedSearchParams.dateTo
      : undefined;

  // Fetch all tags for the dropdown (z fallbackiem per-tag)
  const dbTags = await prisma.tag.findMany({ include: { translations: true } });
  const availableTags = dbTags.map((t) => ({
    value: t.name,
    label: resolveTagName(t, locale),
  }));

  const tNews = await getTranslations('NewsPage');

  // Key for Suspense to trigger re-render on param change
  const suspenseKey = JSON.stringify({
    query,
    tag,
    page,
    sortBy,
    dateFrom,
    dateTo,
  });

  return (
    <div className={style.main}>
      <PageHeader title={tNews('title')} breadcrumbs={[]}>
        <NewsSearchForm
          initialQuery={query}
          initialTag={tag}
          initialSort={sortBy}
          initialDateFrom={dateFrom}
          initialDateTo={dateTo}
          availableTags={availableTags}
        />
      </PageHeader>

      <Suspense key={suspenseKey} fallback={<NewsGridSkeleton />}>
        <NewsGridServer
          query={query}
          locale={locale}
          pathname={getPathname({ locale, href: '/news' })}
          tag={tag}
          page={page}
          sortBy={sortBy}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </Suspense>
    </div>
  );
}
