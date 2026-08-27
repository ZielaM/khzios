import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getEmployeesWithConsultations = cache(async () => {
  return prisma.employee.findMany({
    where: {
      consultations: {
        some: {}, // Only employees with at least one consultation
      },
    },
    include: {
      translations: true,
      consultations: {
        orderBy: { date: 'asc' },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
});

export const getStudentAnnouncements = cache(async () => {
  const now = new Date();

  // Truncate to start of day for simpler comparison if needed, but simple Date arithmetic is fine
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysFuture = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return prisma.studentAnnouncement.findMany({
    where: {
      date: {
        gte: sevenDaysAgo,
        lte: sevenDaysFuture,
      },
    },
    include: {
      translations: true,
    },
    orderBy: {
      date: 'asc',
    },
  });
});
