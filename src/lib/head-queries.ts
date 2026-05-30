import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getDepartmentHead = cache(async () => {
  return prisma.departmentHead.findFirst({
    include: {
      employee: {
        include: {
          translations: true,
          consultations: {
            include: { translations: true },
          },
        },
      },
    },
  });
});
