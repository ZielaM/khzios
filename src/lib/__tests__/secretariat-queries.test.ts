import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getSecretariat } from '../secretariat-queries';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    secretariat: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

describe('secretariat-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSecretariat', () => {
    it('calls prisma.secretariat.findFirst with correct includes', async () => {
      const mockSec = { id: 'sec1' };
      vi.mocked(prisma.secretariat.findFirst).mockResolvedValue(
        mockSec as unknown as Awaited<
          ReturnType<typeof prisma.secretariat.findFirst>
        >
      );

      const result = await getSecretariat();

      expect(prisma.secretariat.findFirst).toHaveBeenCalledWith({
        include: {
          translations: true,
          workingHours: {
            include: { translations: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockSec);
    });
  });
});
