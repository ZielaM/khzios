/**
 * URLs of team and member pages. Team pages use a per-language slug stored
 * in TeamTranslation, falling back to the canonical slug.
 */

import { resolveTranslation } from '@/lib/translations';

interface TeamSlugs {
  slug: string;
  translations: { languageCode: string; slug: string }[];
}

/** URL segment of a team page in the given language. */
export function teamSlugFor(team: TeamSlugs, locale: string): string {
  return (
    resolveTranslation(team.translations, locale).translation?.slug ?? team.slug
  );
}

export function teamHref(team: TeamSlugs, locale: string) {
  return {
    pathname: '/about-us/structure/[team]' as const,
    params: { team: teamSlugFor(team, locale) },
  };
}

export function memberHref(
  team: TeamSlugs,
  locale: string,
  profileSlug: string
) {
  return {
    pathname: '/about-us/structure/[team]/[member]' as const,
    params: { team: teamSlugFor(team, locale), member: profileSlug },
  };
}
