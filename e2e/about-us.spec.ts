import { test, expect } from '@playwright/test';

test.describe('About Us Navigation Spec', () => {
  test.beforeEach(async ({ page }) => {
    // Set to standard desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('should navigate to About Us and verify its main cards', async ({
    page,
  }) => {
    await page.goto('/en');
    await page.waitForLoadState('load');

    // Go to About Us via navbar
    const aboutLink = page
      .locator('nav')
      .getByRole('link', { name: 'About Us', exact: true });
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();

    await expect(page).toHaveURL(/\/en\/about-us/);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    // Check cards
    const structureCard = page
      .locator('main')
      .getByRole('link')
      .filter({ hasText: /Department Structure/i })
      .first();
    await expect(structureCard).toBeVisible();

    const publicationsCard = page
      .locator('main')
      .getByRole('link')
      .filter({ hasText: /Scientific Publications/i })
      .first();
    await expect(publicationsCard).toBeVisible();
  });

  test('should navigate to Structure page and check categories', async ({
    page,
  }) => {
    await page.goto('/en/about-us');
    await page.waitForLoadState('load');

    const structureCard = page
      .locator('main')
      .getByRole('link')
      .filter({ hasText: /Department Structure/i })
      .first();
    await structureCard.click();

    await expect(page).toHaveURL(/\/en\/about-us\/structure/);

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();

    const headCard = page
      .locator('main')
      .getByRole('link')
      .filter({ hasText: /Head of Department/i })
      .first();
    await expect(headCard).toBeVisible();
  });

  test('should navigate to Head of Department page', async ({ page }) => {
    await page.goto('/en/about-us/structure');
    await page.waitForLoadState('load');

    const headCard = page
      .locator('main')
      .getByRole('link')
      .filter({ hasText: /Head of Department/i })
      .first();
    await headCard.click();

    await expect(page).toHaveURL(/\/en\/about-us\/structure\/head/);

    // Check if back link is there
    const backLink = page.getByRole('link', { name: /Back to structure/i });
    await expect(backLink).toBeVisible();
  });

  test('should navigate to Publications page', async ({ page }) => {
    await page.goto('/en/about-us');
    await page.waitForLoadState('load');

    const publicationsCard = page
      .locator('main')
      .getByRole('link')
      .filter({ hasText: /Scientific Publications/i })
      .first();
    await publicationsCard.click();

    await expect(page).toHaveURL(/\/en\/about-us\/publications/);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });
});
