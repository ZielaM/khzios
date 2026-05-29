import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import BackLink from '@/components/BackLink';
import AnimateOnce from '@/components/AnimateOnce';
import { prisma } from '@/lib/prisma';
import NewsSearchForm from '@/components/NewsSearchForm';
import NewsGridServer from '@/components/NewsGrid/NewsGridServer';
import NewsGridSkeleton from '@/components/NewsGrid/NewsGridSkeleton';
import { resolveTagName } from '@/lib/translations';
import { LanguageCode, SortBy } from '@/types/search-types';
import style from './page.module.scss';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}

export default async function NewsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as LanguageCode;

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
  const sortBy =
    typeof resolvedSearchParams.sort === 'string' &&
    ['date', 'relevance'].includes(resolvedSearchParams.sort)
      ? (resolvedSearchParams.sort as SortBy)
      : 'relevance';

  const limit = 12;

  // Fetch all tags for the dropdown (z fallbackiem per-tag)
  const dbTags = await prisma.tag.findMany({ include: { translations: true } });
  const availableTags = dbTags.map((t) => ({
    value: t.name,
    label: resolveTagName(t, locale),
  }));

  const t = await getTranslations('NewsPage');
  const tStruct = await getTranslations('StructurePage');

  // Key for Suspense to trigger re-render on param change
  const suspenseKey = JSON.stringify({ query, tag, page, sortBy });

  return (
    <div className={style.main}>
      <AnimateOnce>
        <BackLink href="/">{tStruct('backToHome')}</BackLink>
      </AnimateOnce>

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
    </div>
  );
}
