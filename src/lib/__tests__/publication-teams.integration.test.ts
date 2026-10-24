// @vitest-environment node
import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { PrismaClient } from '@/generated/prisma/client';
import { startTestDatabase, type TestDatabase } from '@/test/database';
import { getTeamBySlug } from '../team-queries';
import { searchPublications } from '../search/publications';
import {
  publicationSnapshot,
  restorePublication,
  restoreTeam,
  teamSnapshot,
  type TeamSnapshot,
} from '../admin/team-admin';

// The modules under test import the app-wide client; point it at the test database
const holder = vi.hoisted(() => ({ prisma: undefined as unknown }));
vi.mock('@/lib/prisma', () => ({
  prisma: new Proxy(
    {},
    { get: (_, key) => Reflect.get(holder.prisma as object, key) }
  ),
}));
vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

const MIGRATIONS_DIR = path.join(process.cwd(), 'prisma', 'migrations');
const SHARED_TEAMS_MIGRATION = '20261023120000_publications_in_several_teams';

describe('migration to publications in several teams', () => {
  it('moves every existing assignment to the link table', async () => {
    const db = await PGlite.create();
    const migrations = fs
      .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const run = (name: string) =>
      db.exec(
        fs.readFileSync(
          path.join(MIGRATIONS_DIR, name, 'migration.sql'),
          'utf8'
        )
      );
    const index = migrations.indexOf(SHARED_TEAMS_MIGRATION);
    expect(index).toBeGreaterThan(0);
    for (const name of migrations.slice(0, index)) await run(name);

    // Data as it was before: one team per publication, or none
    await db.exec(`
      INSERT INTO "Team" (id, slug, type) VALUES
        ('t1', 'ruminants', 'FULL'), ('t2', 'poultry', 'FULL');
      INSERT INTO "Publication" (id, "teamId", year, authors, journal) VALUES
        ('p1', 't1', 2024, 'A.', 'J'),
        ('p2', 't2', 2023, 'B.', 'J'),
        ('p3', NULL, 2022, 'C.', 'J');
      INSERT INTO "PublicationTranslation" ("publicationId", "languageCode", title)
        VALUES ('p1', 'pl', 'Mleko krów');
    `);
    for (const name of migrations.slice(index)) await run(name);

    const links = await db.query<{ publicationId: string; teamId: string }>(
      'SELECT "publicationId", "teamId" FROM "PublicationTeam" ORDER BY 1'
    );
    expect(links.rows).toEqual([
      { publicationId: 'p1', teamId: 't1' },
      { publicationId: 'p2', teamId: 't2' },
    ]);
    const columns = await db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'Publication' AND column_name = 'teamId'`
    );
    expect(columns.rows).toEqual([]);
    // Publications themselves and their search vectors are untouched
    const kept = await db.query<{ count: number; vectors: number }>(
      `SELECT (SELECT COUNT(*)::int FROM "Publication") AS count,
              (SELECT COUNT(*)::int FROM "PublicationTranslation"
               WHERE "searchVector" IS NOT NULL) AS vectors`
    );
    expect(kept.rows).toEqual([{ count: 3, vectors: 1 }]);

    // Deleting a team or a publication removes only the link
    await db.exec(`DELETE FROM "Team" WHERE id = 't2'`);
    await db.exec(`DELETE FROM "Publication" WHERE id = 'p1'`);
    const after = await db.query<{ links: number; publications: number }>(
      `SELECT (SELECT COUNT(*)::int FROM "PublicationTeam") AS links,
              (SELECT COUNT(*)::int FROM "Publication") AS publications`
    );
    expect(after.rows).toEqual([{ links: 0, publications: 2 }]);
    await db.close();
    // Applies every migration twice over: slow under a parallel coverage run
  }, 60_000);
});

describe('publications shared by several teams', () => {
  let database: TestDatabase;
  let prisma: PrismaClient;
  const year = new Date().getFullYear();

  const team = (id: string, slug: string, displayOrder: number) =>
    prisma.team.create({
      data: {
        id,
        slug,
        type: 'FULL',
        displayOrder,
        translations: {
          create: [{ languageCode: 'pl', slug, name: `Zespół ${slug}` }],
        },
      },
    });
  const publication = (id: string, teamIds: string[], publishedIn = year) =>
    prisma.publication.create({
      data: {
        id,
        year: publishedIn,
        authors: 'Kowalska A.',
        journal: 'Animals',
        translations: {
          create: [{ languageCode: 'pl', title: `Publikacja ${id}` }],
        },
        teams: { create: teamIds.map((teamId) => ({ teamId })) },
      },
    });
  const teamsOf = async (publicationId: string) =>
    (
      await prisma.publicationTeam.findMany({
        where: { publicationId },
        orderBy: { teamId: 'asc' },
      })
    ).map((link) => link.teamId);

  beforeAll(async () => {
    database = await startTestDatabase();
    prisma = database.prisma;
    holder.prisma = prisma;

    // Menu order differs from creation order on purpose
    await team('t-poultry', 'poultry', 2);
    await team('t-ruminants', 'ruminants', 1);
    await team('t-swine', 'swine', 3);
    await publication('shared', ['t-poultry', 't-ruminants']);
    await publication('poultry-only', ['t-poultry'], year - 1);
    await publication('old-shared', ['t-poultry', 't-ruminants'], year - 5);
    await publication('no-team', []);
  }, 60_000);

  afterAll(async () => {
    await database?.stop();
  });

  it('lists a shared publication on the page of every team involved', async () => {
    const poultry = await getTeamBySlug('poultry');
    const ruminants = await getTeamBySlug('ruminants');
    const swine = await getTeamBySlug('swine');

    // Newest first; the five-year window still applies
    expect(poultry?.publications.map((p) => p.id)).toEqual([
      'shared',
      'poultry-only',
    ]);
    expect(ruminants?.publications.map((p) => p.id)).toEqual(['shared']);
    expect(swine?.publications).toEqual([]);
    expect(ruminants?.publications[0].translations[0].title).toBe(
      'Publikacja shared'
    );
  });

  it('shows each publication once in the listing, with all its teams in menu order', async () => {
    const page = await searchPublications({
      language: 'pl',
      page: 1,
      limit: 20,
    });

    expect(page.total).toBe(4);
    expect(page.data.map((p) => p.id).filter((id) => id === 'shared')).toEqual([
      'shared',
    ]);
    const shared = page.data.find((p) => p.id === 'shared');
    expect(shared?.teams.map((link) => link.team.slug)).toEqual([
      'ruminants',
      'poultry',
    ]);
    expect(page.data.find((p) => p.id === 'no-team')?.teams).toEqual([]);

    const found = await searchPublications({
      query: 'publikacja shared',
      language: 'pl',
      page: 1,
      limit: 20,
    });
    expect(found.data.filter((p) => p.id === 'shared')).toHaveLength(1);
  });

  it('keeps a publication on the site when one of its teams is deleted', async () => {
    await team('t-temp', 'temporary', 9);
    await publication('with-temp', ['t-temp', 't-swine']);

    await prisma.team.delete({ where: { id: 't-temp' } });

    expect(await teamsOf('with-temp')).toEqual(['t-swine']);
  });

  it('brings a trashed publication back with the teams that still exist', async () => {
    await team('t-gone', 'gone', 8);
    await publication('trashed', ['t-gone', 't-ruminants']);
    const snapshot = await publicationSnapshot(prisma, 'trashed');
    // As the trash stores it: plain JSON
    const stored = JSON.parse(JSON.stringify(snapshot));
    await prisma.publication.delete({ where: { id: 'trashed' } });
    await prisma.team.delete({ where: { id: 't-gone' } });

    await restorePublication(stored);

    expect(await teamsOf('trashed')).toEqual(['t-ruminants']);
    const restored = await prisma.publication.findUnique({
      where: { id: 'trashed' },
      include: { translations: true },
    });
    expect(restored?.translations.map((t) => t.title)).toEqual([
      'Publikacja trashed',
    ]);
  });

  it('restores a publication trashed before it could have several teams', async () => {
    await restorePublication({
      id: 'legacy',
      year,
      doi: null,
      authors: 'Nowak T.',
      journal: 'Animals',
      teamId: 't-swine',
      translations: [
        { publicationId: 'legacy', languageCode: 'pl', title: 'Stara' },
      ],
    } as never);

    expect(await teamsOf('legacy')).toEqual(['t-swine']);
  });

  it('brings a trashed team back onto its publications, shared ones included', async () => {
    await team('t-dairy', 'dairy', 7);
    await publication('dairy-shared', ['t-dairy', 't-poultry']);
    await publication('dairy-deleted', ['t-dairy']);
    const stored = JSON.parse(
      JSON.stringify(await teamSnapshot(prisma, 't-dairy'))
    ) as TeamSnapshot;
    await prisma.team.delete({ where: { id: 't-dairy' } });
    // The other team keeps the shared publication meanwhile
    expect(await teamsOf('dairy-shared')).toEqual(['t-poultry']);
    await prisma.publication.delete({ where: { id: 'dairy-deleted' } });

    await restoreTeam(stored);

    expect(await teamsOf('dairy-shared')).toEqual(['t-dairy', 't-poultry']);
    expect(
      await prisma.publication.findUnique({ where: { id: 'dairy-deleted' } })
    ).toBeNull();
  });

  it('relinks the publications of a team trashed before they could have several teams', async () => {
    await team('t-old', 'old-team', 6);
    await publication('old-team-paper', []);
    // Moved to another team by an editor while the old team was in the trash
    await publication('old-team-moved', ['t-swine']);
    const stored = JSON.parse(
      JSON.stringify(await teamSnapshot(prisma, 't-old'))
    );
    await prisma.team.delete({ where: { id: 't-old' } });

    await restoreTeam({
      ...stored,
      publications: [{ id: 'old-team-paper' }, { id: 'old-team-moved' }],
    });

    expect(await teamsOf('old-team-paper')).toEqual(['t-old']);
    expect(await teamsOf('old-team-moved')).toEqual(['t-swine']);
  });
});
