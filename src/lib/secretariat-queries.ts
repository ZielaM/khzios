import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export const getSecretariat = cache(async () => {
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
});
