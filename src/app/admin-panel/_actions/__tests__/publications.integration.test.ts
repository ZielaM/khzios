// @vitest-environment node
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';
import { revalidatePath } from 'next/cache';
import type { PrismaClient } from '@/generated/prisma/client';
import { adminHref } from '@/lib/admin/paths';
import { startTestDatabase, type TestDatabase } from '@/test/database';
import { deletePublication, savePublication } from '../teams';

const holder = vi.hoisted(() => ({ prisma: undefined as unknown }));
vi.mock('@/lib/prisma', () => ({
  prisma: new Proxy(
    {},
    { get: (_, key) => Reflect.get(holder.prisma as object, key) }
  ),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/admin/session', () => ({
  requireUser: vi.fn(async () => ({ id: 'u1', login: 'redaktor' })),
}));
vi.mock('@/lib/admin/audit', () => ({ logAudit: vi.fn() }));

let database: TestDatabase;
let prisma: PrismaClient;

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) {
    for (const v of [value].flat()) data.append(name, v);
  }
  return data;
}
const publicationForm = (extra: Record<string, string | string[]>) =>
  form({
    title_pl: 'Wspólna publikacja',
    authors: 'Kowalska A., Nowak T.',
    journal: 'Animals',
    year: '2025',
    ...extra,
  });
const teamsOf = async (publicationId: string) =>
  (
    await prisma.publicationTeam.findMany({
      where: { publicationId },
      orderBy: { teamId: 'asc' },
    })
  ).map((link) => link.teamId);
const revalidated = () =>
  vi.mocked(revalidatePath).mock.calls.map(([pathname]) => pathname);

beforeAll(async () => {
  database = await startTestDatabase();
  prisma = database.prisma;
  holder.prisma = prisma;
  for (const [id, slug] of [
    ['t-ruminants', 'ruminants'],
    ['t-poultry', 'poultry'],
    ['t-swine', 'swine'],
  ]) {
    await prisma.team.create({ data: { id, slug, type: 'FULL' } });
  }
}, 60_000);

afterAll(async () => {
  await database?.stop();
});

beforeEach(() => vi.clearAllMocks());

describe('savePublication', () => {
  it('adds a publication to every team ticked in the form', async () => {
    const result = await savePublication(
      {},
      publicationForm({
        doi: '10.3390/ani-joint-1',
        teams: ['t-ruminants', 't-poultry'],
      })
    );

    expect(result).toEqual({ message: 'Dodano publikację.' });
    const created = await prisma.publication.findUniqueOrThrow({
      where: { doi: '10.3390/ani-joint-1' },
    });
    expect(await teamsOf(created.id)).toEqual(['t-poultry', 't-ruminants']);
    // The admin pages of both teams show the new count
    expect(revalidated()).toEqual(
      expect.arrayContaining([
        adminHref('/teams/t-ruminants'),
        adminHref('/teams/t-poultry'),
      ])
    );
  });

  it('replaces the teams on save and refreshes the ones it left too', async () => {
    await savePublication(
      {},
      publicationForm({
        doi: '10.3390/ani-joint-2',
        teams: ['t-ruminants', 't-poultry'],
      })
    );
    const { id } = await prisma.publication.findUniqueOrThrow({
      where: { doi: '10.3390/ani-joint-2' },
    });
    vi.clearAllMocks();

    const result = await savePublication(
      {},
      publicationForm({ id, doi: '10.3390/ani-joint-2', teams: ['t-swine'] })
    );

    expect(result).toEqual({ message: 'Zapisano.' });
    expect(await teamsOf(id)).toEqual(['t-swine']);
    expect(revalidated()).toEqual(
      expect.arrayContaining([
        adminHref('/teams/t-swine'),
        adminHref('/teams/t-ruminants'),
        adminHref('/teams/t-poultry'),
      ])
    );
  });

  it('saves a publication without a team and ignores teams that no longer exist', async () => {
    await savePublication(
      {},
      publicationForm({
        doi: '10.3390/ani-joint-3',
        teams: ['t-deleted', 't-swine', 't-swine'],
      })
    );
    const { id } = await prisma.publication.findUniqueOrThrow({
      where: { doi: '10.3390/ani-joint-3' },
    });
    expect(await teamsOf(id)).toEqual(['t-swine']);

    await savePublication(
      {},
      publicationForm({ id, doi: '10.3390/ani-joint-3' })
    );
    expect(await teamsOf(id)).toEqual([]);
    const titles = await prisma.publicationTranslation.findMany({
      where: { publicationId: id },
    });
    expect(titles.map((t) => t.title)).toEqual(['Wspólna publikacja']);
  });

  it('reports a publication deleted while it was being edited', async () => {
    const result = await savePublication(
      {},
      publicationForm({ id: 'missing', teams: ['t-swine'] })
    );

    expect(result).toEqual({ error: 'Ta publikacja już nie istnieje.' });
    expect(await prisma.publication.count({ where: { id: 'missing' } })).toBe(
      0
    );
  });
});

describe('deletePublication', () => {
  it('moves the publication to the trash with all its teams', async () => {
    await savePublication(
      {},
      publicationForm({
        doi: '10.3390/ani-joint-4',
        teams: ['t-ruminants', 't-poultry'],
      })
    );
    const { id } = await prisma.publication.findUniqueOrThrow({
      where: { doi: '10.3390/ani-joint-4' },
    });
    vi.clearAllMocks();

    await deletePublication(form({ id }));

    expect(await prisma.publication.count({ where: { id } })).toBe(0);
    expect(await teamsOf(id)).toEqual([]);
    const trashed = await prisma.trashItem.findFirstOrThrow({
      where: { entityId: id },
    });
    expect(
      (trashed.data as { teams: { teamId: string }[] }).teams
        .map((link) => link.teamId)
        .sort()
    ).toEqual(['t-poultry', 't-ruminants']);
    expect(revalidated()).toEqual(
      expect.arrayContaining([
        adminHref('/teams/t-ruminants'),
        adminHref('/teams/t-poultry'),
      ])
    );
  });
});
