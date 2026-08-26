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
