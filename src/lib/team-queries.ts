/**
 * Cached Prisma queries for team pages.
 *
 * Uses React.cache() to deduplicate calls within a single request
 * (e.g. between generateMetadata() and the page component).
 */

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('team-queries');

/**
 * Fetches a single team by its canonical slug with all relations.
 * Includes members (ordered by displayOrder), publications (newest first),
 * projects, courses, and external links — each with translations.
 */
export const getTeamBySlug = cache(async (slug: string) => {
  log.debug({ slug }, 'Fetching team by slug');

  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      translations: true,
      links: {
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
      },
      members: {
        include: {
          employee: {
            include: { translations: true },
          },
        },
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
  }

  return team;
});

/**
 * Zwraca wszystkie slugi zespołów dla wygenerowania statycznych ścieżek.
 */
export async function getAllTeamSlugs() {
  return prisma.team.findMany({
    select: { slug: true },
  });
}

/**
 * Zwraca wszystkie zespoły z tłumaczeniami
 * do renderowania kart na stronie zbiorczej struktury.
 */
export const getAllTeams = cache(async () => {
  return prisma.team.findMany({
    include: {
      translations: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });
});

/** Return type of getTeamBySlug when the team exists */
export type TeamWithRelations = NonNullable<
  Awaited<ReturnType<typeof getTeamBySlug>>
>;

// ──── Member Queries ──────────────────────────────────────────────────

/**
 * Fetches a single team member by their profileSlug with translations
 * and the parent team info for breadcrumbs / context.
 */
export const getMemberBySlug = cache(async (profileSlug: string) => {
  log.debug({ profileSlug }, 'Fetching member by profile slug');

  const member = await prisma.teamMember.findFirst({
    where: { employee: { profileSlug } },
    include: {
      employee: {
        include: { translations: true },
      },
      team: {
        include: {
          translations: true,
        },
      },
    },
  });

  if (!member) {
    log.warn({ profileSlug }, 'Member not found');
  }

  return member;
});

/**
 * Returns all member profile slugs with their parent team slug
 * for static path generation.
 */
export async function getAllMemberSlugs() {
  return prisma.teamMember.findMany({
    select: {
      employee: { select: { profileSlug: true } },
      team: { select: { slug: true } },
    },
  });
}

/** Return type of getMemberBySlug when the member exists */
export type MemberWithRelations = NonNullable<
  Awaited<ReturnType<typeof getMemberBySlug>>
>;
