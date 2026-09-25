import type { MetadataRoute } from 'next';
import { getPathname, routing } from '@/i18n/routing';
import { getPublishedNewsForSitemap } from '@/lib/news-queries';
import { getAllMemberSlugs, getAllTeamSlugs } from '@/lib/team-queries';
import { getSectionImages, IMAGE_SECTIONS } from '@/lib/site-images';
import { toAbsoluteUrl } from '@/lib/seo';

// Rebuild once a day — new articles appear without a redeploy
export const revalidate = 86400;

type Href = Parameters<typeof getPathname>[0]['href'];

/**
 * One <url> per locale, each listing all language versions (hreflang)
 * and the photos shown on that page (Google image sitemap).
 */
function localizedEntries(
  href: Href,
  options: { images?: string[]; lastModified?: Date } = {}
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      toAbsoluteUrl(getPathname({ locale, href })),
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
    getAllTeamSlugs(),
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
      localizedEntries(
        // Same cast as the structure page: team slugs are typed routes
        `/about-us/structure/${team.slug}` as '/about-us/structure/ruminants',
        { images: sectionImageUrls(IMAGE_SECTIONS.team(team.slug)).slice(0, 1) }
      )
    ),
    ...members
      .map((m) =>
        localizedEntries({
          pathname: '/about-us/structure/[team]/[member]',
          params: { team: m.team.slug, member: m.employee.profileSlug },
        })
      )
      .flat(),
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
