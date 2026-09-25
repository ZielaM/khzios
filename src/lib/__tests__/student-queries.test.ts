import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getStudentSchedule, getStudentDocuments } from '../student-queries';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    studentAnnouncement: { findMany: vi.fn() },
    employee: { findMany: vi.fn() },
    studentDocument: { findMany: vi.fn() },
  },
}));

vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

type Resolved<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;

describe('student-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudentSchedule', () => {
    // 10:00 in Poland on 15 July 2026 (UTC+2)
    const now = new Date('2026-07-15T08:00:00Z');

    beforeEach(() => {
      vi.mocked(prisma.studentAnnouncement.findMany).mockResolvedValue([
        {
          id: 'a1',
          date: new Date('2026-07-16T08:00:00Z'),
          important: true,
          translations: [{ languageCode: 'pl', title: 'T', content: 'C' }],
        },
      ] as unknown as Resolved<typeof prisma.studentAnnouncement.findMany>);
      vi.mocked(prisma.employee.findMany).mockResolvedValue([
        {
          id: 'e1',
          firstName: 'Anna',
          lastName: 'Kowalska',
          officeLocation: 'pok. 1',
          translations: [],
          consultations: [
            {
              id: 'c1',
              date: new Date('2026-07-20T00:00:00Z'),
              time: '10:00 - 12:00',
              room: null,
            },
          ],
        },
      ] as unknown as Resolved<typeof prisma.employee.findMany>);
    });

    it('limits announcements to a week back and a week ahead, in Polish days', async () => {
      await getStudentSchedule(now);

      const where = vi.mocked(prisma.studentAnnouncement.findMany).mock
        .calls[0][0]?.where;
      expect(where).toEqual({
        date: {
          gte: new Date('2026-07-07T22:00:00Z'), // start of 8 July
          lt: new Date('2026-07-22T22:00:00Z'), // start of 23 July
        },
      });
    });

    it('only returns consultations from today onwards', async () => {
      await getStudentSchedule(now);

      const args = vi.mocked(prisma.employee.findMany).mock.calls[0][0];
      const today = new Date('2026-07-14T22:00:00Z');
      expect(args?.where).toEqual({
        consultations: { some: { date: { gte: today } } },
      });
      expect(args?.select?.consultations).toMatchObject({
        where: { date: { gte: today } },
      });
    });

    it('serialises dates as ISO strings', async () => {
      const schedule = await getStudentSchedule(now);

      expect(schedule.announcements[0].date).toBe('2026-07-16T08:00:00.000Z');
      expect(schedule.consultations[0].consultations[0].date).toBe(
        '2026-07-20T00:00:00.000Z'
      );
    });
  });

  describe('getStudentDocuments', () => {
    it('orders documents by display order', async () => {
      vi.mocked(prisma.studentDocument.findMany).mockResolvedValue([]);
      await getStudentDocuments();
      expect(prisma.studentDocument.findMany).toHaveBeenCalledWith({
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
      });
    });
  });
});
