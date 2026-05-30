import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getDepartmentHead } from '../head-queries';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    departmentHead: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

describe('head-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDepartmentHead', () => {
    it('calls prisma.departmentHead.findFirst with correct includes', async () => {
      const mockHead = { id: 'head1' };
      vi.mocked(prisma.departmentHead.findFirst).mockResolvedValue(
        mockHead as unknown as Awaited<
          ReturnType<typeof prisma.departmentHead.findFirst>
        >
      );

      const result = await getDepartmentHead();

      expect(prisma.departmentHead.findFirst).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockHead);
    });
  });
});
