// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { PrismaClient } from '@/generated/prisma/client';
import {
  serverDatabaseUrl,
  startTestDatabase,
  type TestDatabase,
} from '@/test/database';
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

const vector = async (sql: string) =>
  (
    await prisma.$queryRawUnsafe<{ v: string }[]>(`SELECT (${sql})::text AS v`)
  )[0].v;
const enableDictionaries = async () =>
  (
    await prisma.$queryRaw<
      { enabled: string[] }[]
    >`SELECT enable_search_dictionaries() AS enabled`
  )[0].enabled;
const ids = (result: { data: { id: string }[] }) =>
  result.data.map((item) => item.id);
const titleIn = (
  result: {
    data: { translations: { languageCode: string; title: string }[] }[];
  },
  languageCode: string
) =>
  result.data[0].translations.find((t) => t.languageCode === languageCode)
    ?.title;

beforeAll(async () => {
  database = await startTestDatabase();
  prisma = database.prisma;
  holder.prisma = prisma;

  await prisma.news.create({
    data: {
      id: 'cows',
      published: true,
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Programowanie hodowli krów',
            content: '<p>Badamy mleko krów rasy Xylandia.</p>',
          },
          {
            languageCode: 'uk',
            title: 'Генетика корів',
            content: '<p>Досліджуємо молоко корів.</p>',
          },
        ],
      },
    },
  });
  // Polish only: readers of other languages reach it through the fallback chain
  await prisma.news.create({
    data: {
      id: 'poultry',
      published: true,
      translations: {
        create: [
          {
            languageCode: 'pl',
            title: 'Dobrostan kur niosek',
            content: '<p>Kury w chowie ściółkowym.</p>',
          },
        ],
      },
    },
  });
  await prisma.publication.create({
    data: {
      id: 'hens',
      year: 2025,
      authors: 'Wiśniewska M.',
      journal: 'Poultry Science',
      translations: {
        create: [{ languageCode: 'pl', title: 'Zachowanie kur niosek' }],
      },
    },
  });
}, 60_000);

afterAll(async () => {
  await database?.stop();
});

it('maps every language to its own text search configuration', async () => {
  const configs = await prisma.$queryRaw<{ lang: string; config: string }[]>`
    SELECT lang::text, search_config(lang)::text AS config
    FROM unnest(enum_range(NULL::"LanguageCode")) AS lang ORDER BY lang`;
  expect(Object.fromEntries(configs.map((c) => [c.lang, c.config]))).toEqual({
    pl: 'polish',
    en: 'english',
    uk: 'ukrainian',
    ru: 'russian',
  });
});

describe.runIf(!serverDatabaseUrl)(
  'without Hunspell dictionaries (PGlite, the Neon development database)',
  () => {
    it('searches Polish and Ukrainian like the simple configuration', async () => {
      const text = `'Programowanie hodowli krów. Генетика корів.'`;
      expect(await vector(`to_tsvector('polish', ${text})`)).toBe(
        await vector(`to_tsvector('simple', ${text})`)
      );
      expect(await vector(`to_tsvector('ukrainian', ${text})`)).toBe(
        await vector(`to_tsvector('simple', ${text})`)
      );
    });

    it('finds the exact word only', async () => {
      expect(ids(await searchNews({ language: 'pl', query: 'krów' }))).toEqual([
        'cows',
      ]);
      expect(ids(await searchNews({ language: 'pl', query: 'krowa' }))).toEqual(
        []
      );
    });

    it('leaves the configurations alone when asked to enable the dictionaries', async () => {
      expect(await enableDictionaries()).toEqual([]);
    });
  }
);

describe.runIf(serverDatabaseUrl)(
  'with the Hunspell dictionaries of the database image',
  () => {
    it('reduces Polish and Ukrainian words to their dictionary form', async () => {
      expect(
        await vector(`to_tsvector('polish', 'Programowanie hodowli krów')`)
      ).toBe(`'hodowla':2 'krowa':3 'programować':1`);
      expect(await vector(`to_tsvector('ukrainian', 'Генетика корів')`)).toBe(
        `'генетик':1 'генетика':1 'корова':2`
      );
    });

    it('finds Polish articles by any inflected form and highlights the word as written', async () => {
      for (const query of ['krowa', 'krowy', 'hodowla', 'programować']) {
        expect(ids(await searchNews({ language: 'pl', query }))).toEqual([
          'cows',
        ]);
      }
      const result = await searchNews({ language: 'pl', query: 'krowy' });
      expect(titleIn(result, 'pl')).toBe(
        'Programowanie hodowli <mark>krów</mark>'
      );
    });

    it('finds Ukrainian articles by any inflected form', async () => {
      const result = await searchNews({ language: 'uk', query: 'корова' });
      expect(ids(result)).toEqual(['cows']);
      expect(titleIn(result, 'uk')).toBe('Генетика <mark>корів</mark>');
    });

    it('stems Polish words typed by readers of other languages', async () => {
      for (const language of ['en', 'uk', 'ru'] as const) {
        expect(ids(await searchNews({ language, query: 'nioska' }))).toEqual([
          'poultry',
        ]);
      }
    });

    it('stems publication titles', async () => {
      const result = await searchPublications({
        language: 'pl',
        query: 'nioska',
      });
      expect(ids(result)).toEqual(['hens']);
      expect(titleIn(result, 'pl')).toBe('Zachowanie kur <mark>niosek</mark>');
    });

    it('keeps words the dictionary does not know as they are written', async () => {
      expect(
        ids(await searchNews({ language: 'pl', query: 'Xylandia' }))
      ).toEqual(['cows']);
      expect(
        ids(await searchPublications({ language: 'pl', query: 'Poultry' }))
      ).toEqual(['hens']);
    });

    it.each([
      ['migrated without the dictionary files', true],
      // pg_restore --clean replaces the configuration but keeps the dictionary
      ['restored from a dump of such a database', false],
    ])('rebuilds the vectors of a database %s', async (_, dropDictionary) => {
      await prisma.$executeRawUnsafe(
        `ALTER TEXT SEARCH CONFIGURATION polish ALTER MAPPING FOR asciiword, asciihword, hword_asciipart, word, hword, hword_part WITH simple`
      );
      if (dropDictionary) {
        await prisma.$executeRawUnsafe(
          `DROP TEXT SEARCH DICTIONARY polish_hunspell`
        );
      }
      await prisma.newsTranslation.update({
        where: {
          newsId_languageCode: { newsId: 'poultry', languageCode: 'pl' },
        },
        data: { title: 'Dobrostan kur niosek' },
      });
      const stored = () =>
        vector(
          `SELECT "searchVector" FROM "NewsTranslation" WHERE "newsId" = 'poultry'`
        );
      expect(await stored()).toContain(`'niosek'`);

      expect(await enableDictionaries()).toEqual(['polish']);
      expect(await stored()).toContain(`'nioska'`);
      // Nothing left to do on a second run
      expect(await enableDictionaries()).toEqual([]);
    });
  }
);
