import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import BackLink from '@/components/BackLink';
import PublicationsSearchForm from '@/components/PublicationsSearchForm';
import PublicationsListServer from '@/components/PublicationsListServer';
import PublicationsListSkeleton from '@/components/PublicationsListSkeleton';
import { LanguageCode } from '@/types/search-types';
import { getPathname } from '@/i18n/routing';
import style from './page.module.scss';

import { Metadata } from 'next';
import { listingMetadata } from '@/lib/seo';
import { setPageLocale } from '@/i18n/page-locale';

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

  const t = await getTranslations({ locale, namespace: 'PublicationsPage' });
  return listingMetadata({
    locale,
    pathname: '/about-us/publications',
    searchParams: await searchParams,
    title: t('title'),
    description: t('metaDescription'),
  });
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

  const t = await getTranslations('PublicationsPage');
  const tStruct = await getTranslations('StructurePage');

  // Key for Suspense to trigger re-render on param change
  const suspenseKey = JSON.stringify({ query, page });

  return (
    <div className={style.main}>
      <BackLink href="/about-us">{tStruct('backToAboutUs')}</BackLink>

      <div className={style.header}>
        <h1 className={style.title}>{t('title')}</h1>
      </div>

      <PublicationsSearchForm initialQuery={query} />

      <Suspense key={suspenseKey} fallback={<PublicationsListSkeleton />}>
        <PublicationsListServer
          query={query}
          locale={locale}
          page={page}
          pathname={getPathname({ locale, href: '/about-us/publications' })}
        />
      </Suspense>
    </div>
  );
}
