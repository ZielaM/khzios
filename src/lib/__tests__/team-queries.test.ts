import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getTeamBySlug,
  getAllTeamSlugs,
  getAllTeams,
  getMemberBySlug,
  getAllMemberSlugs,
} from '../team-queries';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    team: {
      findUnique: vi.fn(),
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

describe('team-queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTeamBySlug', () => {
    it('calls prisma.team.findUnique with correct slug and includes', async () => {
      const mockTeam = { slug: 'test-team' };
      vi.mocked(prisma.team.findUnique).mockResolvedValue(
        mockTeam as unknown as Awaited<
          ReturnType<typeof prisma.team.findUnique>
        >
      );

      const result = await getTeamBySlug('test-team');

      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-team' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTeam);
    });
  });

  describe('getAllTeamSlugs', () => {
    it('selects all team slugs', async () => {
      const mockSlugs = [{ slug: 'team-a' }, { slug: 'team-b' }];
      vi.mocked(prisma.team.findMany).mockResolvedValue(
        mockSlugs as unknown as Awaited<ReturnType<typeof prisma.team.findMany>>
      );

      const result = await getAllTeamSlugs();

      expect(prisma.team.findMany).toHaveBeenCalledWith({
        select: { slug: true },
      });
      expect(result).toEqual(mockSlugs);
    });
  });

  describe('getAllTeams', () => {
    it('fetches all teams ordered by displayOrder', async () => {
      const mockTeams = [{ id: '1' }];
      vi.mocked(prisma.team.findMany).mockResolvedValue(
        mockTeams as unknown as Awaited<ReturnType<typeof prisma.team.findMany>>
      );

      const result = await getAllTeams();

      expect(prisma.team.findMany).toHaveBeenCalledWith({
        include: { translations: true },
        orderBy: { displayOrder: 'asc' },
      });
      expect(result).toEqual(mockTeams);
    });
  });

  describe('getMemberBySlug', () => {
    it('fetches a member by profileSlug', async () => {
      const mockMember = { id: 'm1' };
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(
        mockMember as unknown as Awaited<
          ReturnType<typeof prisma.teamMember.findFirst>
        >
      );

      const result = await getMemberBySlug('john-doe');

      expect(prisma.teamMember.findFirst).toHaveBeenCalledWith({
        where: { employee: { profileSlug: 'john-doe' } },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockMember);
    });
  });

  describe('getAllMemberSlugs', () => {
    it('selects member profile slugs and team slugs', async () => {
      const mockData = [
        { employee: { profileSlug: 'john' }, team: { slug: 'team-a' } },
      ];
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue(
        mockData as unknown as Awaited<
          ReturnType<typeof prisma.teamMember.findMany>
        >
      );

      const result = await getAllMemberSlugs();

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith({
        where: { employee: { profileSlug: { not: null } } },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockData);
    });
  });
});
