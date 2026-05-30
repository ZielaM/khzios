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
        include: { translations: true },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  });
});
