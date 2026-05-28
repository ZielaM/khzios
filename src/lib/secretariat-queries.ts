import { prisma } from '@/lib/prisma';

export async function getSecretariat() {
  return prisma.secretariat.findFirst({
    include: {
      translations: true,
      workingHours: {
        include: {
          translations: true,
        },
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
  });
}
