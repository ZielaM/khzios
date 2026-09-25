import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getTeamBySlug,
  getAllTeams,
  getMemberBySlug,
  getAllMemberSlugs,
  getNavigationTeams,
} from '../team-queries';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    teamMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

type Resolved<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;

describe('team-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getTeamBySlug', () => {
    const team = {
      slug: 'ruminants',
      projects: [
        { id: 'p1', years: '2018–2020' },
        { id: 'p2', years: '2021–2023' },
        { id: 'p3', years: '2025–' },
        { id: 'p4', years: 'ongoing' },
      ],
    };

    it('finds a team by its slug in any language or its canonical slug', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(
        team as unknown as Resolved<typeof prisma.team.findFirst>
      );

      await getTeamBySlug('przezuwajace');

      const args = vi.mocked(prisma.team.findFirst).mock.calls[0][0];
      expect(args?.where).toEqual({
        OR: [
          { slug: 'przezuwajace' },
          { translations: { some: { slug: 'przezuwajace' } } },
        ],
      });
    });

    it('limits publications to the last five years', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(
        team as unknown as Resolved<typeof prisma.team.findFirst>
      );

      await getTeamBySlug('ruminants');

      const args = vi.mocked(prisma.team.findFirst).mock.calls[0][0];
      expect(args?.include?.publications).toMatchObject({
        where: { year: { gte: 2022 } },
      });
    });

    it('keeps projects that end within the last five years or are ongoing', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(
        team as unknown as Resolved<typeof prisma.team.findFirst>
      );

      const result = await getTeamBySlug('ruminants');

      expect(result?.projects.map((p) => p.id)).toEqual(['p2', 'p3', 'p4']);
    });

    it('returns null for an unknown team', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(null);
      expect(await getTeamBySlug('unknown')).toBeNull();
    });
  });

  describe('getAllTeams', () => {
    it('orders teams by display order', async () => {
      vi.mocked(prisma.team.findMany).mockResolvedValue([]);
      await getAllTeams();
      expect(prisma.team.findMany).toHaveBeenCalledWith({
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('getNavigationTeams', () => {
    it('returns names and page slugs in the requested language', async () => {
      vi.mocked(prisma.team.findMany).mockResolvedValue([
        {
          slug: 'ruminants',
          translations: [
            { languageCode: 'pl', name: 'Przeżuwacze', slug: 'przezuwajace' },
            { languageCode: 'en', name: 'Ruminants', slug: 'ruminants' },
          ],
        },
      ] as unknown as Resolved<typeof prisma.team.findMany>);

      expect(await getNavigationTeams('pl')).toEqual([
        { name: 'Przeżuwacze', slug: 'przezuwajace' },
      ]);
      // uk falls back to English
      expect(await getNavigationTeams('uk')).toEqual([
        { name: 'Ruminants', slug: 'ruminants' },
      ]);
    });
  });

  describe('getMemberBySlug', () => {
    it('looks the member up within the given team', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      await getMemberBySlug('jan-kowalski', 'team-2');

      expect(prisma.teamMember.findFirst).toHaveBeenCalledWith({
        where: { teamId: 'team-2', employee: { profileSlug: 'jan-kowalski' } },
        include: expect.any(Object),
      });
    });
  });

  describe('getAllMemberSlugs', () => {
    it('selects profile slugs with the team slugs needed for URLs', async () => {
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);
      await getAllMemberSlugs();
      expect(prisma.teamMember.findMany).toHaveBeenCalledWith({
        select: {
          employee: { select: { profileSlug: true } },
          team: {
            select: {
              slug: true,
              translations: { select: { languageCode: true, slug: true } },
            },
          },
        },
      });
    });
  });
});
