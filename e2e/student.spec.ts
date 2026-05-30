import { test, expect } from '@playwright/test';

test.describe('For Students Page', () => {
  test('should navigate to the student consultations page via desktop navbar', async ({
    page,
  }) => {
    // Set viewport to a desktop size
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/pl');

    // Click the link in the navbar
    await page.click('nav >> text="Dla studenta"');

    // Wait for URL to be correct
    await expect(page).toHaveURL(/.*\/student/);

    // Verify the page title
    await expect(page.locator('h1')).toHaveText('Konsultacje dla studentów');
  });

  test('should navigate to the student consultations page via mobile menu', async ({
    page,
  }) => {
    // Set viewport to a mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/pl');

    // Open hamburger menu
    await page.click('button[aria-label="Przełącz menu"]');

    // Click the link inside the mobile menu
    await page.click('text="Dla studenta"');

    // Wait for URL to be correct
    await expect(page).toHaveURL(/.*\/student/);

    // Verify the page title
    await expect(page.locator('h1')).toHaveText('Konsultacje dla studentów');
  });

  test('should display the responsive consultation table', async ({ page }) => {
    await page.goto('/pl/student');

    // Make sure we have the table wrapper
    const tableContainer = page.locator('table');
    await expect(tableContainer).toBeVisible();

    // Verify headers on desktop (on mobile they are visually hidden but exist in DOM)
    // We can just verify table cells or rows are present
    const rows = page.locator('tbody tr');
    // Ensure we have at least one employee seeded
    await expect(rows.first()).toBeVisible();

    // The first row should have cell texts
    const firstRowName = rows.first().locator('td').first();
    await expect(firstRowName).not.toBeEmpty();
  });

  test('BackLink should redirect to home page', async ({ page }) => {
    await page.goto('/pl/student');

    // Click "Wróć do strony głównej"
    const backLink = page.locator('a', { hasText: 'Wróć do strony głównej' });
    await backLink.waitFor({ state: 'visible' });
    // Wait for Next.js hydration and framer-motion animations to settle for Webkit
    await page.waitForTimeout(1000);
    await backLink.click();

    // Assert redirect
    await expect(page).toHaveURL(/.*\/pl$/);
  });
});
