import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pl');
  });

  test('introduces the department and leads to its main pages', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Katedra Hodowli Zwierząt i Oceny Surowców',
      })
    ).toBeVisible();
    const main = page.locator('main');
    await main.getByRole('link', { name: 'O katedrze' }).click();
    await expect(page).toHaveURL(/\/pl\/o-nas$/);
    await page.goBack();
    await main.getByRole('link', { name: 'Dla studentów' }).first().click();
    await expect(page).toHaveURL(/\/pl\/student$/);
  });

  test('lists the latest news, each leading to its article', async ({
    page,
  }) => {
    const news = page.getByRole('region', { name: 'Aktualności' });
    const first = news.getByRole('article').first().getByRole('link');
    const title = (await first.textContent())!.trim();
    await first.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);

    await page.goBack();
    await news.getByRole('link', { name: 'Wszystkie aktualności' }).click();
    await expect(page).toHaveURL(/\/pl\/aktualnosci$/);
  });

  test('shows the department in numbers and links its teams', async ({
    page,
  }) => {
    const stats = page.getByRole('list', { name: 'Katedra w liczbach' });
    const items = await stats.getByRole('listitem').allTextContents();
    expect(items).toHaveLength(3);
    for (const item of items) expect(item).toMatch(/[1-9]\d*/);

    const research = page.getByRole('region', {
      name: 'Zespoły i kierunki badań',
    });
    const team = research.getByRole('link').filter({ hasNotText: /Struktura/ });
    const name = (await team.first().textContent())!.trim();
    await team.first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  });

  test('lets visitors pause and resume the photo slideshow', async ({
    page,
  }) => {
    const pause = page.getByRole('button', { name: 'Wstrzymaj pokaz zdjęć' });
    await pause.click();
    const play = page.getByRole('button', { name: 'Wznów pokaz zdjęć' });
    await expect(play).toBeVisible();
    await play.click();
    await expect(pause).toBeVisible();
  });
});
