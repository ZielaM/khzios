// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import sitemap from '../sitemap';

vi.mock('@/i18n/routing', async (importOriginal) => importOriginal());
vi.mock('next/navigation', async (importOriginal) => importOriginal());
vi.mock('@/lib/news-queries', () => ({
  getPublishedNewsForSitemap: async () => [
    {
      id: 'n1',
      updatedAt: new Date('2026-09-01T10:00:00Z'),
      photos: [{ url: '/media/krowy-0123456789ab.webp' }],
    },
  ],
}));
const team = {
  slug: 'bydlo',
  translations: [
    { languageCode: 'pl', slug: 'bydlo' },
    { languageCode: 'en', slug: 'cattle' },
  ],
};
vi.mock('@/lib/team-queries', () => ({
  getAllTeams: async () => [team],
  getAllMemberSlugs: async () => [
    { team, employee: { profileSlug: 'anna-kowalska' } },
  ],
}));
vi.mock('@/lib/site-images', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getSectionImageUrls: async () => (section: string) => [
    `/images/${section}/1.jpg`,
    `/images/${section}/2.jpg`,
  ],
}));

afterEach(() => vi.unstubAllEnvs());

const BASE = 'https://khzios.up.poznan.pl';

describe('sitemap.xml', () => {
  it('lists every page once per language, with all language versions', async () => {
    vi.stubEnv('APP_URL', BASE);
    const entries = await sitemap();
    // 10 fixed pages, one team, one profile and one article, in 4 languages
    expect(entries).toHaveLength(4 * 13);
    for (const entry of entries) {
      expect(entry.url.startsWith(`${BASE}/`)).toBe(true);
      expect(Object.keys(entry.alternates!.languages!)).toEqual([
        'pl',
        'en',
        'uk',
        'ru',
      ]);
      expect(Object.values(entry.alternates!.languages!)).toContain(entry.url);
    }
  });

  it('shows all home page photos and the first photo of other sections', async () => {
    vi.stubEnv('APP_URL', BASE);
    const entries = await sitemap();
    const home = entries.find((e) => e.url === `${BASE}/pl`)!;
    expect(home.images).toEqual([
      `${BASE}/images/hero/1.jpg`,
      `${BASE}/images/hero/2.jpg`,
    ]);
    const teamPages = entries.filter((e) =>
      e.images?.[0]?.includes('/teams/bydlo/')
    );
    // The structure page and the team page itself, in every language
    expect(teamPages).toHaveLength(8);
    expect(teamPages.every((e) => e.images!.length === 1)).toBe(true);
  });

  it('uses the address of each language for teams and profiles', async () => {
    vi.stubEnv('APP_URL', BASE);
    const urls = (await sitemap()).map((e) => e.url);
    expect(
      urls.some((u) => u.startsWith(`${BASE}/en/`) && u.endsWith('/cattle'))
    ).toBe(true);
    expect(
      urls.some((u) => u.startsWith(`${BASE}/pl/`) && u.endsWith('/bydlo'))
    ).toBe(true);
    expect(
      urls.some(
        (u) =>
          u.startsWith(`${BASE}/en/`) && u.endsWith('/cattle/anna-kowalska')
      )
    ).toBe(true);
  });

  it('dates articles by their last change and lists their photos', async () => {
    vi.stubEnv('APP_URL', BASE);
    const articles = (await sitemap()).filter((e) => e.url.endsWith('/n1'));
    expect(articles).toHaveLength(4);
    expect(articles[0].lastModified).toEqual(new Date('2026-09-01T10:00:00Z'));
    expect(articles[0].images).toEqual([
      `${BASE}/media/krowy-0123456789ab.webp`,
    ]);
  });
});
