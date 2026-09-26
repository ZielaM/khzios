import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated WCAG 2.1 AA scan. axe finds roughly a third of accessibility
// problems (contrast, names, labels, ARIA misuse, landmarks); keyboard and
// screen reader behaviour is covered by the other specs.
const PAGES = [
  '/pl',
  '/pl/aktualnosci',
  '/pl/o-nas',
  '/pl/o-nas/struktura',
  '/pl/o-nas/struktura/przezuwajace',
  '/pl/o-nas/struktura/przezuwajace/tomasz-nowak',
  '/pl/o-nas/struktura/kierownik',
  '/pl/o-nas/publikacje',
  '/pl/student',
  '/pl/kontakt',
  '/pl/deklaracja-dostepnosci',
  '/pl/nie-ma-takiej-strony',
];

// Entry animations fade content in; mid-fade text has lower contrast than
// its final state, which axe would report
test.use({ contextOptions: { reducedMotion: 'reduce' } });

// The rules do not depend on the engine; one browser keeps CI fast
test.skip(({ browserName }) => browserName !== 'chromium');

async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  // A readable summary in the failure message instead of the raw objects
  return violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 3)
        .map((n) => `    ${n.target.join(' ')}: ${n.any[0]?.message ?? ''}`)
        .join('\n')
  );
}

async function firstArticle(page: Page) {
  await page.goto('/pl/aktualnosci');
  return page
    .locator('a[href^="/pl/aktualnosci/"]')
    .first()
    .getAttribute('href');
}

for (const [name, viewport] of [
  ['desktop', { width: 1280, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
] as const) {
  test.describe(`axe (${name})`, () => {
    test.use({ viewport });

    for (const path of PAGES) {
      test(path, async ({ page }) => {
        await page.goto(path);
        expect(await scan(page)).toEqual([]);
      });
    }

    test('article', async ({ page }) => {
      const href = await firstArticle(page);
      expect(href).toBeTruthy();
      await page.goto(href!);
      expect(await scan(page)).toEqual([]);
    });
  });
}

test.describe('axe (high contrast)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem('wcag-high-contrast', 'true')
    );
  });

  for (const path of ['/pl', '/pl/aktualnosci', '/pl/student', '/pl/kontakt']) {
    test(path, async ({ page }) => {
      await page.goto(path);
      expect(await scan(page)).toEqual([]);
    });
  }
});
