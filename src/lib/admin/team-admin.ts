import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient;

const teamInclude = {
  translations: true,
  members: true,
  publications: { select: { publicationId: true } },
  projects: { include: { translations: true } },
  courses: { include: { translations: true } },
  links: { include: { translations: true } },
} satisfies Prisma.TeamInclude;

export function teamSnapshot(tx: Tx, id: string) {
  return tx.team.findUnique({ where: { id }, include: teamInclude });
}
export type TeamSnapshot = NonNullable<
  Awaited<ReturnType<typeof teamSnapshot>>
>;

/** Snapshots trashed before publications could belong to several teams. */
type LegacyTeamSnapshot = Omit<TeamSnapshot, 'publications'> & {
  publications: { id: string }[];
};

/**
 * Recreates a team with its pages' content. Its publications stay on the
 * site while it is in the trash (they only lose this team) and are linked
 * back here, unless they were deleted in the meantime.
 */
export async function restoreTeam(data: TeamSnapshot | LegacyTeamSnapshot) {
  const linked = data.publications.flatMap((p) =>
    'publicationId' in p ? [p.publicationId] : []
  );
  // Before, a publication had one team: one moved to another team while
  // this one was in the trash stays where the editor put it
  const unassigned = data.publications.flatMap((p) =>
    'publicationId' in p ? [] : [p.id]
  );
  const [employees, publications] = await Promise.all([
    prisma.employee.findMany({
      where: { id: { in: data.members.map((m) => m.employeeId) } },
      select: { id: true },
    }),
    prisma.publication.findMany({
      where: {
        OR: [
          { id: { in: linked } },
          { id: { in: unassigned }, teams: { none: {} } },
        ],
      },
      select: { id: true },
    }),
  ]);
  const employeeIds = new Set(employees.map((e) => e.id));
  const { id, slug, type, displayOrder } = data;
  const { translations, members, projects, courses, links } = data;

  await prisma.team.create({
    data: {
      id,
      slug,
      type,
      displayOrder,
      translations: {
        create: translations.map((t) => ({
          languageCode: t.languageCode,
          slug: t.slug,
          name: t.name,
          researchDescription: t.researchDescription,
          teachingDescription: t.teachingDescription,
        })),
      },
      members: {
        create: members
          .filter((m) => employeeIds.has(m.employeeId))
          .map(({ id, employeeId, category }) => ({
            id,
            employeeId,
            category,
          })),
      },
      projects: {
        create: projects.map(({ id, years, translations }) => ({
          id,
          years,
          translations: {
            create: translations.map((t) => ({
              languageCode: t.languageCode,
              title: t.title,
              funder: t.funder,
            })),
          },
        })),
      },
      courses: {
        create: courses.map(({ id, translations }) => ({
          id,
          translations: {
            create: translations.map((t) => ({
              languageCode: t.languageCode,
              name: t.name,
              program: t.program,
              coordinator: t.coordinator,
            })),
          },
        })),
      },
      links: {
        create: links.map(({ id, url, icon, displayOrder, translations }) => ({
          id,
          url,
          icon,
          displayOrder,
          translations: {
            create: translations.map((t) => ({
              languageCode: t.languageCode,
              label: t.label,
            })),
          },
        })),
      },
      publications: {
        create: publications.map((p) => ({ publicationId: p.id })),
      },
    },
  });
}

export function publicationSnapshot(tx: Tx, id: string) {
  return tx.publication.findUnique({
    where: { id },
    include: { translations: true, teams: { select: { teamId: true } } },
  });
}
export type PublicationSnapshot = NonNullable<
  Awaited<ReturnType<typeof publicationSnapshot>>
>;

/** Snapshots trashed before publications could belong to several teams. */
type LegacyPublicationSnapshot = Omit<PublicationSnapshot, 'teams'> & {
  teamId: string | null;
};

/** Recreates a publication in those of its teams that still exist. */
export async function restorePublication(
  data: PublicationSnapshot | LegacyPublicationSnapshot
) {
  const teamIds =
    'teams' in data
      ? data.teams.map((link) => link.teamId)
      : data.teamId
        ? [data.teamId]
        : [];
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true },
  });
  await prisma.publication.create({
    data: {
      id: data.id,
      year: data.year,
      doi: data.doi,
      authors: data.authors,
      journal: data.journal,
      translations: {
        create: data.translations.map(({ languageCode, title }) => ({
          languageCode,
          title,
        })),
      },
      teams: { create: teams.map((team) => ({ teamId: team.id })) },
    },
  });
}
