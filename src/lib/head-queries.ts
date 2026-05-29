import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getDepartmentHead = cache(async () => {
  return prisma.departmentHead.findFirst({
    include: {
      translations: true,
      workingHours: {
        orderBy: {
          displayOrder: 'asc',
        },
        include: {
          translations: true,
        },
      },
    },
  });
});
