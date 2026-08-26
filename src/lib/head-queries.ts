import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getDepartmentHead = cache(async () => {
  return prisma.departmentHead.findFirst({
    include: {
      workingHours: {
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
      },
      employee: {
        include: {
          translations: true,
          consultations: {
            orderBy: { date: 'asc' },
          },
        },
      },
    },
  });
});
