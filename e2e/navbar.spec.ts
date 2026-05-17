import { test, expect } from '@playwright/test';

test.describe('Navbar Navigation Spec', () => {
  test.describe('Desktop Layout', () => {
    test.beforeEach(async ({ page }) => {
      // Set to standard desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/en');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle'); // Wait for JS bundles and hydration to complete
    });

    test('should navigate to News page from Homepage and back successfully', async ({
      page,
    }) => {
      // 1. Locate News link specifically within the navbar element
      const newsLink = page
        .locator('nav')
        .getByRole('link', { name: 'News', exact: true });
      await expect(newsLink).toBeVisible();

      // 2. Click the link to navigate
      await newsLink.click();

      // 3. Verify path transitions to /en/news
      await expect(page).toHaveURL(/\/en\/news/);

      // CRITICAL: Wait for initial search synchronization debounce to complete and stabilize URL state (sort=date)
      // to prevent race conditions during transitions away from the News page
      await expect(page).toHaveURL(/sort=date/);

      // 4. Verify we loaded the News page (check heading)
      const heading = page.getByRole('heading', { name: 'News', exact: true });
      await expect(heading).toBeVisible();

      // 5. Locate the Home logo link in the navbar using its robust test-id
      const homeLink = page.getByTestId('logo-link');
      await expect(homeLink).toBeVisible();

      // 6. Click the Home link to navigate back
      await homeLink.click();

      // 7. Verify path transitions back to the Homepage /en exactly (using exact end anchor)
      await expect(page).toHaveURL(/\/en$/);
      await expect(page).not.toHaveURL(/\/news/);
    });
  });

  test.describe('Mobile Accordion & Hamburger Layout', () => {
    test.beforeEach(async ({ page }) => {
      // Set to mobile viewport size
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/en');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle'); // Wait for JS bundles and hydration to complete
    });

    test('should open mobile hamburger, navigate to News, and close menu after transition, then go back to Homepage', async ({
      page,
    }) => {
      // 1. Locate hamburger button using translation-based label
      const hamburger = page.getByRole('button', { name: 'Toggle menu' });
      await expect(hamburger).toBeVisible();

      // 2. Click hamburger to slide open the menu
      await hamburger.click();

      // 3. Locate the News link specifically inside the active mobile menu overlay/nav
      const newsLink = page
        .locator('nav')
        .getByRole('link', { name: 'News', exact: true });
      await expect(newsLink).toBeVisible();

      // 4. Click News link
      await newsLink.click();

      // 5. Verify successful navigation to /en/news
      await expect(page).toHaveURL(/\/en\/news/);

      // CRITICAL: Wait for initial search synchronization debounce to complete and stabilize URL state (sort=date)
      await expect(page).toHaveURL(/sort=date/);

      // 6. Hamburger state should revert to closed and menu content should not be active/expanded
      await expect(hamburger).not.toHaveClass(/active/);

      // 7. Locate the Home logo link in the navbar using its robust test-id
      const homeLink = page.getByTestId('logo-link');
      await expect(homeLink).toBeVisible();

      // 8. Click the Home logo link to navigate back
      await homeLink.click();

      // 9. Verify URL transitions back to /en exactly
      await expect(page).toHaveURL(/\/en$/);
    });
  });
});
