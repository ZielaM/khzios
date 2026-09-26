/**
 * Prisma queries for team, member and structure pages.
 *
 * Per-request functions use React.cache() so generateMetadata() and the page
 * component share one database round trip.
 */

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { resolveTranslation } from '@/lib/translations';
import { teamSlugFor } from '@/lib/team-routes';

const log = createLogger('team-queries');

/** Team pages list publications and projects from this many recent years. */
export const RECENT_YEARS = 5;

function firstRecentYear(now = new Date()): number {
  return now.getFullYear() - (RECENT_YEARS - 1);
}

/** Last year mentioned in a project period such as "2021–2024" or "2023". */
function projectEndYear(years: string): number | undefined {
  const matches = years.match(/\d{4}/g);
  return matches ? Number(matches[matches.length - 1]) : undefined;
}

/**
 * A team addressed by a URL segment: its slug in any language or its
 * canonical slug (older links and language switches stay valid).
 */
export const getTeamBySlug = cache(async (slug: string) => {
  const sinceYear = firstRecentYear();
  const team = await prisma.team.findFirst({
    where: { OR: [{ slug }, { translations: { some: { slug } } }] },
    include: {
      translations: true,
      links: {
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
      },
      members: {
        include: { employee: { include: { translations: true } } },
        orderBy: [
          { employee: { lastName: 'asc' } },
          { employee: { firstName: 'asc' } },
        ],
      },
      courses: {
        include: { translations: true },
        orderBy: { id: 'asc' },
      },
      publications: {
        where: { year: { gte: sinceYear } },
        include: { translations: true },
        orderBy: { year: 'desc' },
      },
      projects: {
        include: { translations: true },
        orderBy: { id: 'desc' },
      },
    },
  });

  if (!team) {
    log.warn({ slug }, 'Team not found');
    return null;
  }

  // Ongoing projects without an end year stay listed
  return {
    ...team,
    projects: team.projects.filter(
      (p) => (projectEndYear(p.years) ?? sinceYear) >= sinceYear
    ),
  };
});

export type TeamWithRelations = NonNullable<
  Awaited<ReturnType<typeof getTeamBySlug>>
>;

/** Every team with the data needed to link to it in each language. */
export const getAllTeams = cache(async () => {
  return prisma.team.findMany({
    include: { translations: true },
    orderBy: { displayOrder: 'asc' },
  });
});

/**
 * A member profile within a given team. Looking up by team as well as by
 * profile slug keeps the profile reachable for people in several teams.
 */
export const getMemberBySlug = cache(
  async (profileSlug: string, teamId: string) => {
    const member = await prisma.teamMember.findFirst({
      where: { teamId, employee: { profileSlug } },
      include: {
        employee: { include: { translations: true } },
        team: { include: { translations: true } },
      },
    });

    if (!member) {
      log.warn({ profileSlug, teamId }, 'Member not found');
    }

    return member;
  }
);

/** Every team membership with the slugs needed for profile URLs. */
export async function getAllMemberSlugs() {
  return prisma.teamMember.findMany({
    select: {
      employee: { select: { profileSlug: true } },
      team: {
        select: {
          slug: true,
          translations: { select: { languageCode: true, slug: true } },
        },
      },
    },
  });
}

export type MemberWithRelations = NonNullable<
  Awaited<ReturnType<typeof getMemberBySlug>>
>;

/** Team names and page slugs for the main menu, in menu order. */
export const getNavigationTeams = cache(async (locale: string) => {
  const teams = await prisma.team.findMany({
    select: {
      slug: true,
      translations: {
        select: { languageCode: true, name: true, slug: true },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return teams.map((team) => ({
    name:
      resolveTranslation(team.translations, locale).translation?.name ??
      team.slug,
    slug: teamSlugFor(team, locale),
  }));
});

export type NavigationTeam = Awaited<
  ReturnType<typeof getNavigationTeams>
>[number];

/** Headline numbers for the home page. */
export const getDepartmentStats = cache(async () => {
  const [teams, employees, publications] = await Promise.all([
    prisma.team.count(),
    prisma.employee.count(),
    prisma.publication.count({ where: { year: { gte: firstRecentYear() } } }),
  ]);
  return { teams, employees, publications };
});
