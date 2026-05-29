import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import BackLink from '@/components/BackLink';
import AnimateOnce from '@/components/AnimateOnce';
import PublicationsSearchForm from '@/components/PublicationsSearchForm';
import PublicationsListServer from '@/components/PublicationsListServer';
import PublicationsListSkeleton from '@/components/PublicationsListSkeleton';
import { LanguageCode } from '@/types/search-types';
import style from './page.module.scss';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}

export default async function PublicationsPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as LanguageCode;

  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams.query === 'string'
      ? resolvedSearchParams.query
      : undefined;

  const parsedPage =
    typeof resolvedSearchParams.page === 'string'
      ? parseInt(resolvedSearchParams.page, 10)
      : NaN;
  const page = Number.isFinite(parsedPage) ? parsedPage : 1;

  const limit = 12;

  const t = await getTranslations('PublicationsPage');
  const tStruct = await getTranslations('StructurePage');

  // Key for Suspense to trigger re-render on param change
  const suspenseKey = JSON.stringify({ query, page });

  return (
    <div className={style.main}>
      <AnimateOnce>
        <BackLink href="/about-us">{tStruct('backToAboutUs')}</BackLink>
      </AnimateOnce>

      <div className={style.header}>
        <h1 className={style.title}>{t('title')}</h1>
      </div>

      <PublicationsSearchForm initialQuery={query} />

      <Suspense key={suspenseKey} fallback={<PublicationsListSkeleton />}>
        <PublicationsListServer
          query={query}
          locale={locale}
          page={page}
          limit={limit}
        />
      </Suspense>
    </div>
  );
}
