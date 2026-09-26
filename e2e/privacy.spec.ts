import { test, expect } from '@playwright/test';

test.describe('Privacy policy', () => {
  test('is linked from the footer and lists what the browser stores', async ({
    page,
  }) => {
    await page.goto('/pl');
    await page
      .locator('footer')
      .getByRole('link', { name: 'Polityka prywatności' })
      .click();

    await expect(page).toHaveURL(/\/pl\/polityka-prywatnosci$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Polityka prywatności' })
    ).toBeVisible();
    for (const name of [
      'NEXT_LOCALE',
      'wcag-high-contrast',
      'wcag-font-offset',
    ]) {
      await expect(page.getByRole('rowheader', { name })).toBeVisible();
    }
  });

  test('exists in every language', async ({ page }) => {
    for (const path of [
      '/en/privacy-policy',
      '/uk/polityka-konfidentsiinosti',
      '/ru/politika-konfidentsialnosti',
    ]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});
