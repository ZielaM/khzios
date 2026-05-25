/**
 * Cached Prisma queries for team pages.
 *
 * Uses React.cache() to deduplicate calls within a single request
 * (e.g. between generateMetadata() and the page component).
 */

import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Fetches a single team by its canonical slug with all relations.
 * Includes members (ordered by displayOrder), publications (newest first),
 * projects, courses, and external links — each with translations.
 */
export const getTeamBySlug = cache(async (slug: string) => {
  return prisma.team.findUnique({
    where: { slug },
    include: {
      translations: true,
      links: {
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
      },
      members: {
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
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
});

/**
 * Zwraca wszystkie slugi zespołów dla wygenerowania statycznych ścieżek.
 */
export async function getAllTeamSlugs() {
  return prisma.team.findMany({
    select: { slug: true },
  });
}

/** Return type of getTeamBySlug when the team exists */
export type TeamWithRelations = NonNullable<
  Awaited<ReturnType<typeof getTeamBySlug>>
>;
