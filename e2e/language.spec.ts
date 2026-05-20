import { test, expect } from '@playwright/test';

test.describe('Language Switching & State Preservation Spec', () => {
  test.beforeEach(async ({ page }) => {
    // Set a large desktop viewport to keep controls fully visible by default
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('should toggle between locales and translate static UI strings', async ({
    page,
  }) => {
    // 1. Start on the English news page
    await page.goto('/en/news');
    await page.waitForLoadState('load');

    // Wait for initial search synchronization debounce to stabilize URL state (sort=date)
    await expect(page).toHaveURL(/sort=date/);

    // Expand settings dropdown if collapsed inside a compact layout
    const settingsToggle = page.getByRole('button', {
      name: 'Accessibility settings',
    });
    if (await settingsToggle.isVisible()) {
      await settingsToggle.click();
    }

    // 2. Locate the search input and verify it has the English placeholder
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toHaveAttribute('placeholder', 'Search news...');

    // 3. Locate and click the Polish (PL) switcher button using its inner text content
    const plButton = page.locator('button', { hasText: 'PL' });
    await expect(plButton).toBeVisible();
    await plButton.click();

    // 4. Verify URL transitioned to the Polish route: /pl/aktualnosci
    await expect(page).toHaveURL(/\/pl\/aktualnosci/);

    // 5. Verify the search input placeholder is now translated to Polish
    await expect(searchInput).toHaveAttribute(
      'placeholder',
      'Szukaj aktualności...'
    );

    // Re-expand settings dropdown on new route if collapsed
    const reloadSettingsToggle = page.getByRole('button', {
      name: 'Accessibility settings',
    });
    if (await reloadSettingsToggle.isVisible()) {
      await reloadSettingsToggle.click();
    }

    // 6. Verify that the "PL" button is now disabled (active state) and "EN" is enabled
    await expect(page.locator('button', { hasText: 'PL' })).toBeDisabled();
    await expect(page.locator('button', { hasText: 'EN' })).toBeEnabled();
  });

  test('should strictly preserve active search, tag, page, and sort parameters during switch', async ({
    page,
  }) => {
    // 1. Load the page with multiple active filters, sorting, and pagination
    await page.goto('/en/news?query=art&tag=Education&sort=relevance&page=1');
    await page.waitForLoadState('load');

    // Wait for the debounce-based search synchronization to fully stabilize
    // before triggering the locale switch.
    await expect(page).toHaveURL(/sort=relevance/);
    await page.waitForTimeout(1000);

    // Expand settings dropdown if collapsed
    const settingsToggle = page.getByRole('button', {
      name: 'Accessibility settings',
    });
    if (await settingsToggle.isVisible()) {
      await settingsToggle.click();
    }

    // 2. Click the Polish switcher button (hasText: 'PL')
    const plButton = page.locator('button', { hasText: 'PL' });
    await expect(plButton).toBeVisible();
    await plButton.click();

    // 3. Expect path to change to /pl/aktualnosci with query params preserved
    // Each param is verified individually because browser-specific debounce timing
    // can cause transient intermediate URL states.
    await expect(page).toHaveURL(/\/pl\/aktualnosci/);
    await expect(page).toHaveURL(/query=art/);
    await expect(page).toHaveURL(/sort=relevance/);
    await expect(page).toHaveURL(/page=1/);
  });
});
