/**
 * Page metadata: titles, descriptions, canonical and language alternates,
 * and share images.
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getPathname, routing, type Locale } from '@/i18n/routing';
import { getAppUrl } from '@/lib/env';

export { getAppUrl };

/** Default share image (1200×630) used when a page has no photo of its own */
export const DEFAULT_OG_IMAGE = '/og-image.png';

/** Square logo referenced from JSON-LD structured data */
export const LOGO_IMAGE = '/logo-seal.png';

/** Turns a site-relative path (`/images/...`) into an absolute URL. */
export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, getAppUrl()).toString();
}

type Href = Parameters<typeof getPathname>[0]['href'];

/** A route, or a function of the locale for routes with per-language slugs. */
export type LocalizedHref = Href | ((locale: Locale) => Href);

function pathFor(href: LocalizedHref, locale: Locale): string {
  return getPathname({
    locale,
    href: typeof href === 'function' ? href(locale) : href,
  });
}

/**
 * Canonical URL of the page in the current language and the addresses of
 * every language version (hreflang), with Polish as x-default.
 */
export function buildAlternates(
  href: LocalizedHref,
  locale: string
): NonNullable<Metadata['alternates']> {
  return {
    canonical: pathFor(href, locale as Locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, pathFor(href, l)])),
      'x-default': pathFor(href, routing.defaultLocale),
    },
  };
}

interface PageMetadataOptions {
  locale: string;
  href: LocalizedHref;
  /** Page title without the site name (the layout template appends it) */
  title?: string;
  description?: string;
  /** Page photo for link previews; the site's default image otherwise */
  image?: { src: string; alt: string } | null;
}

/**
 * Complete metadata for a page. A page-level `openGraph` replaces the
 * layout's object entirely, so every field is set here rather than relying
 * on inheritance.
 */
export async function pageMetadata({
  locale,
  href,
  title,
  description,
  image,
}: PageMetadataOptions): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'HomePage' });
  const siteName = t('heroTitle');
  const alternates = buildAlternates(href, locale);
  const canonical = pathFor(href, locale as Locale);
  const shareTitle = title ? `${title} | ${siteName}` : siteName;
  const shareImage = image
    ? { url: image.src, alt: image.alt || shareTitle }
    : { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: siteName };

  return {
    ...(title && { title }),
    ...(description && { description }),
    alternates,
    openGraph: {
      type: 'website',
      siteName,
      locale,
      url: canonical,
      title: shareTitle,
      description,
      images: [shareImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [shareImage.url],
    },
  };
}

type ListingParams = { [key: string]: string | string[] | undefined };

/**
 * Metadata for a searchable listing. Filtered or searched views are not
 * indexed (their content duplicates the listing); plain pages of the listing
 * keep a self-referencing canonical URL.
 */
export async function listingMetadata(
  options: Omit<PageMetadataOptions, 'href'> & {
    pathname: '/news' | '/about-us/publications';
    searchParams: ListingParams;
  }
): Promise<Metadata> {
  const { pathname, searchParams, ...rest } = options;
  const page = typeof searchParams.page === 'string' ? searchParams.page : '';
  const isFiltered = Object.entries(searchParams).some(
    ([key, value]) => key !== 'page' && value
  );
  const href =
    /^\d+$/.test(page) && page !== '1'
      ? { pathname, query: { page } }
      : pathname;

  return {
    ...(await pageMetadata({ ...rest, href })),
    ...(isFiltered && { robots: { index: false, follow: true } }),
  };
}
