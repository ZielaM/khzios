import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfDayOffset } from '@/lib/dates';
import type { StudentScheduleDto } from '@/lib/student-schedule';

/** How many days of past announcements the "show past" toggle can reveal. */
export const PAST_ANNOUNCEMENT_DAYS = 7;
/** How far ahead announcements are listed. */
export const UPCOMING_ANNOUNCEMENT_DAYS = 7;

/**
 * Announcements around today and all upcoming consultations. Served by an
 * uncached API route, because these change far more often than the rest of
 * the (weekly revalidated) student page.
 */
export async function getStudentSchedule(
  now: Date = new Date()
): Promise<StudentScheduleDto> {
  const today = startOfDay(now);

  const [announcements, employees] = await Promise.all([
    prisma.studentAnnouncement.findMany({
      where: {
        date: {
          gte: startOfDayOffset(now, -PAST_ANNOUNCEMENT_DAYS),
          lt: startOfDayOffset(now, UPCOMING_ANNOUNCEMENT_DAYS + 1),
        },
      },
      select: {
        id: true,
        date: true,
        important: true,
        translations: {
          select: { languageCode: true, title: true, content: true },
        },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.employee.findMany({
      where: { consultations: { some: { date: { gte: today } } } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        officeLocation: true,
        translations: { select: { languageCode: true, academicTitle: true } },
        consultations: {
          where: { date: { gte: today } },
          select: { id: true, date: true, time: true, room: true },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
  ]);

  return {
    announcements: announcements.map((a) => ({
      ...a,
      date: a.date.toISOString(),
    })),
    consultations: employees.map((e) => ({
      ...e,
      consultations: e.consultations.map((c) => ({
        ...c,
        date: c.date.toISOString(),
      })),
    })),
  };
}

export const getStudentDocuments = cache(async () => {
  return prisma.studentDocument.findMany({
    include: {
      translations: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });
});
