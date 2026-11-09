import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { startOfDayOffset } from '@/lib/dates';
import type { StudentScheduleDto } from '@/lib/student-schedule';

/** How many days of past announcements the "show past" toggle can reveal. */
export const PAST_ANNOUNCEMENT_DAYS = 7;
/** How far ahead announcements are listed. */
export const UPCOMING_ANNOUNCEMENT_DAYS = 7;

/**
 * Announcements around today and the weekly consultation hours. Served by an
 * uncached API route, because announcements depend on the current day.
 */
export async function getStudentSchedule(
  now: Date = new Date()
): Promise<StudentScheduleDto> {
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
      where: { consultations: { some: {} } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        officeLocation: true,
        translations: { select: { languageCode: true, academicTitle: true } },
        consultations: {
          select: {
            id: true,
            weekday: true,
            startTime: true,
            endTime: true,
            room: true,
            translations: { select: { languageCode: true, note: true } },
          },
          orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
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
    consultations: employees,
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
