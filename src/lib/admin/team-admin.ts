import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient;

const teamInclude = {
  translations: true,
  members: true,
  publications: { select: { id: true } },
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

/**
 * Recreates a team with its pages' content. Publications keep existing
 * without a team while it is in the trash and are linked back here.
 */
export async function restoreTeam(data: TeamSnapshot) {
  const employees = await prisma.employee.findMany({
    where: { id: { in: data.members.map((m) => m.employeeId) } },
    select: { id: true },
  });
  const employeeIds = new Set(employees.map((e) => e.id));
  const {
    translations,
    members,
    publications,
    projects,
    courses,
    links,
    ...team
  } = data;

  await prisma.$transaction([
    prisma.team.create({
      data: {
        ...team,
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
          create: links.map(
            ({ id, url, icon, displayOrder, translations }) => ({
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
            })
          ),
        },
      },
    }),
    prisma.publication.updateMany({
      where: { id: { in: publications.map((p) => p.id) }, teamId: null },
      data: { teamId: team.id },
    }),
  ]);
}

export function publicationSnapshot(tx: Tx, id: string) {
  return tx.publication.findUnique({
    where: { id },
    include: { translations: true },
  });
}
export type PublicationSnapshot = NonNullable<
  Awaited<ReturnType<typeof publicationSnapshot>>
>;

export async function restorePublication(data: PublicationSnapshot) {
  const { translations, teamId, ...publication } = data;
  const team = teamId
    ? await prisma.team.findUnique({ where: { id: teamId } })
    : null;
  await prisma.publication.create({
    data: {
      ...publication,
      teamId: team?.id ?? null,
      translations: {
        create: translations.map(({ languageCode, title }) => ({
          languageCode,
          title,
        })),
      },
    },
  });
}
