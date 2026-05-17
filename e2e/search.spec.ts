import { test, expect } from '@playwright/test';

test.describe('News Search & Filtering Spec', () => {
  test.beforeEach(async ({ page }) => {
    // Set a large desktop viewport to keep controls fully visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/en/news');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should apply query with debounce and reset pagination to page 1', async ({
    page,
  }) => {
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();

    // 1. Initial State: URL has no query parameters
    await expect(page).not.toHaveURL(/\?.*query=/);

    // 2. Type "performance" (a word present in the seed data for Sports)
    await searchInput.fill('performance');

    // 3. Immediately after typing, the URL shouldn't have changed due to the 500ms debounce
    expect(page.url()).not.toContain('query=performance');

    // 4. Wait for the debounce to trigger URL push (Playwright will auto-wait until expectation is met)
    await expect(page).toHaveURL(/query=performance/);

    // 5. Ensure that page=1 was forced on query change
    await expect(page).toHaveURL(/page=1/);
  });

  test('should show sort option only when query is active and switch to relevance sorting automatically', async ({
    page,
  }) => {
    const searchInput = page.getByTestId('search-input');

    // Use standard accessibility role/aria-label to locate the Sort By dropdown
    const sortSelect = page.getByLabel('Sort by');

    // 1. Initial State: No query, so sorting dropdown should NOT be visible/rendered and sort=date should be present
    await expect(sortSelect).not.toBeVisible();
    await expect(page).toHaveURL(/sort=date/);

    // 2. Type a query, which should make the sorting selector visible
    await searchInput.fill('team');
    await expect(sortSelect).toBeVisible();

    // 3. Wait for debounce and ensure the URL contains sort=relevance
    await expect(page).toHaveURL(/sort=relevance/);
  });

  test('should allow filtering by tags using react-select and update the URL', async ({
    page,
  }) => {
    // Locate react-select by its standard accessible aria-label defined in en.json
    const tagSelectInput = page.getByLabel('Tag (e.g. education)');
    await expect(tagSelectInput).toBeVisible();

    // 1. Click on react-select input
    await tagSelectInput.click();

    // 2. Press ArrowDown to show the dropdown list and press Enter to select the first tag
    await tagSelectInput.press('ArrowDown');
    await tagSelectInput.press('Enter');

    // 3. Verify that URL has updated with the tag parameter
    await expect(page).toHaveURL(/tag=[A-Za-z]+/);
  });

  test('should automatically reset sort to date when query is cleared', async ({
    page,
  }) => {
    // 1. Start with an existing query and relevance sorting in the URL
    await page.goto('/en/news?query=computer&sort=relevance');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toHaveValue('computer');
    await expect(page).toHaveURL(/sort=relevance/);

    // 2. Clear the query input
    await searchInput.fill('');

    // 3. Expect sort parameter to fall back to 'date' because relevance sorting requires a query
    await expect(page).toHaveURL(/sort=date/);
    await expect(page).not.toHaveURL(/query=/);
  });

  test('should preserve sort by date parameter when changing query', async ({
    page,
  }) => {
    // 1. Start with an existing query and date sorting in the URL
    await page.goto('/en/news?query=computer&sort=date');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toHaveValue('computer');
    await expect(page).toHaveURL(/sort=date/);

    // 2. Change the query input
    await searchInput.fill('art');

    // 3. Expect sort parameter to be 'date' even after changing query
    await expect(page).toHaveURL(/sort=date/);
    await expect(page).toHaveURL(/query=art/);
    await expect(page).toHaveURL(/page=1/);
  });
});
