import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getNewsById, getPublishedNewsForSitemap } from '../news-queries';
import {
  getDepartmentStats,
  getMemberBySlug,
  getNavigationTeams,
} from '../team-queries';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    news: { findUnique: vi.fn(), findMany: vi.fn() },
    team: { findMany: vi.fn(), count: vi.fn() },
    teamMember: { findFirst: vi.fn() },
    employee: { count: vi.fn() },
    publication: { count: vi.fn() },
  },
}));
vi.mock('react', () => ({ cache: <T>(fn: T) => fn }));

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('news queries', () => {
  it('returns null for a missing or unpublished article', async () => {
    vi.mocked(prisma.news.findUnique).mockResolvedValue(null);
    expect(await getNewsById('draft')).toBeNull();
    expect(vi.mocked(prisma.news.findUnique).mock.calls[0][0]).toMatchObject({
      where: { id: 'draft', published: true },
    });
  });

  it('lists only published articles for the sitemap', async () => {
    vi.mocked(prisma.news.findMany).mockResolvedValue([]);
    await getPublishedNewsForSitemap();
    expect(vi.mocked(prisma.news.findMany).mock.calls[0][0]).toMatchObject({
      where: { published: true },
    });
  });
});

describe('team queries', () => {
  it('returns null for a profile that is not in the team', async () => {
    vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);
    expect(await getMemberBySlug('jan-kowalski', 't1')).toBeNull();
  });

  it('returns the profile of a team member', async () => {
    const member = { id: 'm1', employee: { profileSlug: 'jan-kowalski' } };
    vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(member as never);
    expect(await getMemberBySlug('jan-kowalski', 't1')).toBe(member);
    expect(prisma.teamMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { teamId: 't1', employee: { profileSlug: 'jan-kowalski' } },
      })
    );
  });

  it('names a team without any translation by its slug in the menu', async () => {
    vi.mocked(prisma.team.findMany).mockResolvedValue([
      { slug: 'bydlo', translations: [] },
    ] as never);
    expect(await getNavigationTeams('en')).toEqual([
      { name: 'bydlo', slug: 'bydlo' },
    ]);
  });

  it('counts publications from the last five years for the home page', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    vi.mocked(prisma.team.count).mockResolvedValue(6);
    vi.mocked(prisma.employee.count).mockResolvedValue(40);
    vi.mocked(prisma.publication.count).mockResolvedValue(120);

    expect(await getDepartmentStats()).toEqual({
      teams: 6,
      employees: 40,
      publications: 120,
    });
    expect(prisma.publication.count).toHaveBeenCalledWith({
      where: { year: { gte: 2022 } },
    });
  });
});
