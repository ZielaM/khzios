import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = Prisma.TransactionClient;

export const WEEKDAYS: {
  order: number;
  names: Record<'pl' | 'en' | 'uk' | 'ru', string>;
}[] = [
  {
    order: 1,
    names: {
      pl: 'Poniedziałek',
      en: 'Monday',
      uk: 'Понеділок',
      ru: 'Понедельник',
    },
  },
  {
    order: 2,
    names: { pl: 'Wtorek', en: 'Tuesday', uk: 'Вівторок', ru: 'Вторник' },
  },
  {
    order: 3,
    names: { pl: 'Środa', en: 'Wednesday', uk: 'Середа', ru: 'Среда' },
  },
  {
    order: 4,
    names: { pl: 'Czwartek', en: 'Thursday', uk: 'Четвер', ru: 'Четверг' },
  },
  {
    order: 5,
    names: { pl: 'Piątek', en: 'Friday', uk: "П'ятниця", ru: 'Пятница' },
  },
  {
    order: 6,
    names: { pl: 'Sobota', en: 'Saturday', uk: 'Субота', ru: 'Суббота' },
  },
  {
    order: 7,
    names: { pl: 'Niedziela', en: 'Sunday', uk: 'Неділя', ru: 'Воскресенье' },
  },
];

/**
 * Weekly hours from a form with fields hours_1 … hours_7, in the shape the
 * site reads (lib/working-hours.ts): one row per day with the day's name in
 * every language; an empty value means closed.
 */
export function weeklyHoursFrom(formData: FormData) {
  return WEEKDAYS.map(({ order, names }) => ({
    displayOrder: order,
    translations: {
      create: Object.entries(names).map(([languageCode, day]) => ({
        languageCode: languageCode as 'pl' | 'en' | 'uk' | 'ru',
        day,
        hours: String(formData.get(`hours_${order}`) ?? '')
          .trim()
          .slice(0, 60),
      })),
    },
  }));
}

const employeeInclude = {
  translations: true,
  teamMembers: true,
  consultations: true,
} satisfies Prisma.EmployeeInclude;

export function employeeSnapshot(tx: Tx, id: string) {
  return tx.employee.findUnique({ where: { id }, include: employeeInclude });
}
export type EmployeeSnapshot = NonNullable<
  Awaited<ReturnType<typeof employeeSnapshot>>
>;

/** Recreates an employee with titles, team memberships and consultations. */
export async function restoreEmployee(data: EmployeeSnapshot) {
  const teams = await prisma.team.findMany({
    where: { id: { in: data.teamMembers.map((m) => m.teamId) } },
    select: { id: true },
  });
  const teamIds = new Set(teams.map((t) => t.id));
  const { translations, teamMembers, consultations, ...employee } = data;
  await prisma.employee.create({
    data: {
      ...employee,
      translations: {
        create: translations.map(({ languageCode, academicTitle }) => ({
          languageCode,
          academicTitle,
        })),
      },
      teamMembers: {
        create: teamMembers
          .filter((m) => teamIds.has(m.teamId))
          .map(({ id, teamId, category }) => ({ id, teamId, category })),
      },
      consultations: {
        create: consultations.map(({ id, room, date, time }) => ({
          id,
          room,
          date,
          time,
        })),
      },
    },
  });
}
