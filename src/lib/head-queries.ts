import { prisma } from '@/lib/prisma';

export async function getDepartmentHead() {
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
}
