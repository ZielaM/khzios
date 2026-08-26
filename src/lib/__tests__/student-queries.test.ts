import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getEmployeesWithConsultations } from '../student-queries';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

describe('student-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmployeesWithConsultations', () => {
    it('calls prisma.employee.findMany filtering only employees with consultations', async () => {
      const mockEmployees = [{ id: 'e1' }];
      vi.mocked(prisma.employee.findMany).mockResolvedValue(
        mockEmployees as unknown as Awaited<
          ReturnType<typeof prisma.employee.findMany>
        >
      );

      const result = await getEmployeesWithConsultations();

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: {
          consultations: { some: {} },
        },
        include: {
          translations: true,
          consultations: {
            orderBy: { date: 'asc' },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
      expect(result).toEqual(mockEmployees);
    });
  });
});
