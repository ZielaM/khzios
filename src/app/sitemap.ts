import type { MetadataRoute } from 'next';
import { getPathname, routing } from '@/i18n/routing';
import { getPublishedNewsForSitemap } from '@/lib/news-queries';
import { getAllMemberSlugs, getAllTeams } from '@/lib/team-queries';
import { memberHref, teamHref } from '@/lib/team-routes';
import { getSectionImages, IMAGE_SECTIONS } from '@/lib/site-images';
import { toAbsoluteUrl } from '@/lib/seo';

// Rendered per request: it is fetched rarely (by crawlers) and must not be
// prerendered during `next build`, which runs without database access.
export const dynamic = 'force-dynamic';

type Href = Parameters<typeof getPathname>[0]['href'];
type Locale = (typeof routing.locales)[number];

/**
 * One <url> per locale, each listing all language versions (hreflang)
 * and the photos shown on that page (Google image sitemap). `href` may
 * depend on the locale when the page has per-language slugs.
 */
function localizedEntries(
  href: Href | ((locale: Locale) => Href),
  options: { images?: string[]; lastModified?: Date } = {}
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      toAbsoluteUrl(
        getPathname({
          locale,
          href: typeof href === 'function' ? href(locale) : href,
        })
      ),
    ])
  );

  return routing.locales.map((locale) => ({
    url: languages[locale],
    lastModified: options.lastModified,
    alternates: { languages },
    images: options.images?.map(toAbsoluteUrl),
  }));
}

/** Image URLs of a section folder (alt texts are irrelevant here) */
function sectionImageUrls(section: string): string[] {
  return getSectionImages(section, routing.defaultLocale).map((i) => i.src);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, teams, members] = await Promise.all([
    getPublishedNewsForSitemap(),
    getAllTeams(),
    getAllMemberSlugs(),
  ]);

  return [
    ...localizedEntries('/', {
      images: sectionImageUrls(IMAGE_SECTIONS.hero),
    }),
    ...localizedEntries('/news'),
    ...localizedEntries('/about-us', {
      images: sectionImageUrls(IMAGE_SECTIONS.aboutUs),
    }),
    ...localizedEntries('/about-us/structure', {
      images: teams.flatMap((t) =>
        sectionImageUrls(IMAGE_SECTIONS.team(t.slug)).slice(0, 1)
      ),
    }),
    ...localizedEntries('/about-us/structure/head'),
    ...localizedEntries('/about-us/publications'),
    ...localizedEntries('/student', {
      images: sectionImageUrls(IMAGE_SECTIONS.student).slice(0, 1),
    }),
    ...localizedEntries('/contact', {
      images: sectionImageUrls(IMAGE_SECTIONS.contact).slice(0, 1),
    }),
    ...teams.flatMap((team) =>
      localizedEntries((locale) => teamHref(team, locale), {
        images: sectionImageUrls(IMAGE_SECTIONS.team(team.slug)).slice(0, 1),
      })
    ),
    ...members.flatMap((m) =>
      localizedEntries((locale) =>
        memberHref(m.team, locale, m.employee.profileSlug)
      )
    ),
    ...news.flatMap((article) =>
      localizedEntries(
        { pathname: '/news/[id]', params: { id: article.id } },
        {
          lastModified: article.updatedAt,
          images: article.photos.map((p) => p.url),
        }
      )
    ),
  ];
}
