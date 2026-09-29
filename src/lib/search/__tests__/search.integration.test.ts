// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { PrismaClient } from '@/generated/prisma/client';
import { startTestDatabase, type TestDatabase } from '@/test/database';
import { searchNews } from '../news';
import { searchPublications } from '../publications';

// The search modules import the app-wide client; point it at the test database
const holder = vi.hoisted(() => ({ prisma: undefined as unknown }));
vi.mock('@/lib/prisma', () => ({
  prisma: new Proxy(
    {},
    { get: (_, key) => Reflect.get(holder.prisma as object, key) }
  ),
}));

let database: TestDatabase;
let prisma: PrismaClient;

const translation = (
  languageCode: 'pl' | 'en',
  title: string,
  content = ''
) => ({
  languageCode,
  title,
  content,
});

beforeAll(async () => {
  database = await startTestDatabase();
  prisma = database.prisma;
  holder.prisma = prisma;

  const poultry = await prisma.tag.create({
    data: {
      name: 'drob',
      translations: {
        create: [
          { languageCode: 'pl', name: 'Drób' },
          { languageCode: 'en', name: 'Poultry' },
        ],
      },
    },
  });
  const cattle = await prisma.tag.create({ data: { name: 'bydlo' } });

  await prisma.news.create({
    data: {
      id: 'dairy',
      published: true,
      publishedAt: new Date('2026-09-05T10:00:00Z'), // 12:00 on 5 Sep in Poland
      tags: { connect: { id: cattle.id } },
      translations: {
        create: [
          translation(
            'pl',
            'Wydajność mleczna krów',
            '<p>Badamy mleko i krowy.</p>'
          ),
          translation(
            'en',
            'Dairy cow productivity',
            '<p>We study milk yield.</p>'
          ),
        ],
      },
    },
  });
  await prisma.news.create({
    data: {
      id: 'poultry',
      published: true,
      publishedAt: new Date('2026-09-05T21:30:00Z'), // 23:30 on 5 Sep in Poland
      tags: { connect: { id: poultry.id } },
      // Polish only: English readers must still find it through the fallback
      translations: {
        create: [
          translation(
            'pl',
            'Genetyka drobiu ozdobnego',
            '<p>Kury i drobiu.</p>'
          ),
        ],
      },
    },
  });
  await prisma.news.create({
    data: {
      id: 'meat',
      published: true,
      publishedAt: new Date('2026-09-06T00:30:00Z'), // 02:30 on 6 Sep in Poland
      translations: {
        create: [
          translation('pl', 'Ocena jakości mięsa', '<p>Tusze i krowy.</p>'),
        ],
      },
    },
  });
  await prisma.news.create({
    data: {
      id: 'draft',
      published: false,
      translations: {
        create: [translation('pl', 'Szkic o krowy', '<p>krowy</p>')],
      },
    },
  });

  await prisma.publication.create({
    data: {
      year: 2023,
      authors: 'Kowalski J., Nowak A.',
      journal: 'Journal of Dairy Science',
      translations: {
        create: [
          { languageCode: 'pl', title: 'Skład kwasów tłuszczowych mleka' },
          { languageCode: 'en', title: 'Fatty acid composition of milk' },
        ],
      },
    },
  });
  await prisma.publication.create({
    data: {
      year: 2025,
      authors: 'Wiśniewska M.',
      journal: 'Poultry Science',
      translations: {
        create: [{ languageCode: 'pl', title: 'Dobrostan kur niosek' }],
      },
    },
  });
}, 60_000);

afterAll(async () => {
  await database?.stop();
});

const ids = (result: { data: { id: string }[] }) =>
  result.data.map((n) => n.id);

describe('searchNews', () => {
  it('lists published articles, newest first', async () => {
    const result = await searchNews({ language: 'pl' });
    expect(ids(result)).toEqual(['meat', 'poultry', 'dairy']);
    expect(result.total).toBe(3);
  });

  it('includes the whole last day of a date range, in Polish time', async () => {
    const result = await searchNews({
      language: 'pl',
      dateFrom: '2026-09-05',
      dateTo: '2026-09-05',
    });
    // 23:30 on the 5th is included, 02:30 on the 6th is not
    expect(ids(result)).toEqual(['poultry', 'dairy']);
  });

  it('filters by a tag name in any language', async () => {
    expect(ids(await searchNews({ language: 'pl', tag: 'Drób' }))).toEqual([
      'poultry',
    ]);
    expect(ids(await searchNews({ language: 'en', tag: 'Poultry' }))).toEqual([
      'poultry',
    ]);
  });

  it('finds matches with full-text search and highlights them', async () => {
    const result = await searchNews({ language: 'pl', query: 'krowy' });

    expect(ids(result).sort()).toEqual(['dairy', 'meat']);
    const dairy = result.data.find((n) => n.id === 'dairy');
    const pl = dairy?.translations.find((t) => t.languageCode === 'pl');
    expect(pl?.content).toContain('<mark>krowy</mark>');
  });

  it('never returns unpublished articles', async () => {
    const result = await searchNews({ language: 'pl', query: 'szkic' });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('finds Polish-only articles for English readers via the fallback chain', async () => {
    const result = await searchNews({ language: 'en', query: 'drobiu' });
    expect(ids(result)).toEqual(['poultry']);
    expect(result.data[0].translations[0].title).toContain(
      '<mark>drobiu</mark>'
    );
  });

  it('combines a search with tag and date filters', async () => {
    expect(
      ids(
        await searchNews({
          language: 'pl',
          query: 'krowy',
          tag: 'bydlo',
          dateFrom: '2026-09-05',
          dateTo: '2026-09-05',
        })
      )
    ).toEqual(['dairy']);
    expect(
      ids(
        await searchNews({
          language: 'pl',
          query: 'krowy',
          dateFrom: '2026-09-06',
        })
      )
    ).toEqual(['meat']);
    expect(
      ids(
        await searchNews({
          language: 'pl',
          query: 'krowy',
          dateTo: '2026-09-05',
        })
      )
    ).toEqual(['dairy']);
  });

  it('sorts equally relevant matches by date', async () => {
    const result = await searchNews({
      language: 'pl',
      query: 'krowy',
      sortBy: 'relevance',
    });
    expect(ids(result)).toEqual(['meat', 'dairy']);
  });

  it('keeps the total when a search is paged beyond its results', async () => {
    const result = await searchNews({
      language: 'pl',
      query: 'krowy',
      page: 5,
    });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(2);
  });

  it('paginates results', async () => {
    const first = await searchNews({ language: 'pl', limit: 2, page: 1 });
    const second = await searchNews({ language: 'pl', limit: 2, page: 2 });

    expect(first.totalPages).toBe(2);
    expect(ids(first)).toEqual(['meat', 'poultry']);
    expect(ids(second)).toEqual(['dairy']);
  });

  it('returns an empty page beyond the last one', async () => {
    const result = await searchNews({ language: 'pl', page: 50 });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(3);
  });
});

describe('searchPublications', () => {
  it('lists publications, newest year first', async () => {
    const result = await searchPublications({ language: 'pl' });
    expect(result.data.map((p) => p.year)).toEqual([2025, 2023]);
  });

  it('searches titles, authors and journals', async () => {
    const byAuthor = await searchPublications({
      language: 'pl',
      query: 'Kowalski',
    });
    expect(byAuthor.data.map((p) => p.year)).toEqual([2023]);

    const byJournal = await searchPublications({
      language: 'pl',
      query: 'Poultry',
    });
    expect(byJournal.data.map((p) => p.year)).toEqual([2025]);

    const byTitle = await searchPublications({
      language: 'pl',
      query: 'mleka',
    });
    expect(byTitle.data[0].translations[0].title).toContain(
      '<mark>mleka</mark>'
    );
  });

  it('highlights only the language that matched', async () => {
    const result = await searchPublications({ language: 'pl', query: 'mleka' });
    const titles = Object.fromEntries(
      result.data[0].translations.map((t) => [t.languageCode, t.title])
    );
    expect(titles.pl).toContain('<mark>mleka</mark>');
    expect(titles.en).toBe('Fatty acid composition of milk');
  });

  it('returns an empty page when nothing matches', async () => {
    const result = await searchPublications({
      language: 'pl',
      query: 'nieistniejące',
    });
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
