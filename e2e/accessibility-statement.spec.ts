import { test, expect } from '@playwright/test';

test.describe('Accessibility statement', () => {
  test('is linked from the footer and follows the official template', async ({
    page,
  }) => {
    await page.goto('/pl');
    await page
      .locator('footer')
      .getByRole('link', { name: 'Deklaracja dostępności' })
      .click();

    await expect(page).toHaveURL(/\/pl\/deklaracja-dostepnosci$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Deklaracja dostępności' })
    ).toBeVisible();

    // Parts that automated monitoring looks up by id
    for (const id of [
      'a11y-podmiot',
      'a11y-url',
      'a11y-data-publikacja',
      'a11y-data-aktualizacja',
      'a11y-status',
      'a11y-data-sporzadzenie',
      'a11y-kontakt',
      'a11y-osoba',
      'a11y-email',
      'a11y-telefon',
      'a11y-procedura',
      'a11y-architektura',
    ]) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    await expect(page.locator('#a11y-data-publikacja')).toHaveAttribute(
      'datetime',
      /^\d{4}-\d{2}-\d{2}$/
    );
  });

  test('has a translated address in every language', async ({ page }) => {
    for (const path of [
      '/en/accessibility-statement',
      '/uk/deklaratsiia-dostupnosti',
      '/ru/deklaratsiya-dostupnosti',
    ]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});
