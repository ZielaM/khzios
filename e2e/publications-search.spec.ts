import { test, expect } from '@playwright/test';

test.describe('Publications Search Form & Logic Spec', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    // Go to the main publications page
    await page.goto('/en/about-us/publications');
    await page.waitForLoadState('load');
  });

  test('should apply query with debounce and update URL without immediately reloading', async ({
    page,
  }) => {
    // 1. Locate search input using placeholder text translated in en.json
    const searchInput = page
      .locator('main')
      .getByPlaceholder('Search by title, authors, or journal...');
    await expect(searchInput).toBeVisible();

    // 2. Initial State: URL has no query parameters
    await expect(page).not.toHaveURL(/\?.*query=/);

    // 3. Type a keyword into the search bar
    await searchInput.click();
    await searchInput.fill('science');

    // 4. Immediately after typing, the URL shouldn't have changed due to 500ms debounce
    expect(page.url()).not.toContain('query=science');

    // 5. Wait for the debounce to trigger URL push
    await expect(page).toHaveURL(/query=science/);
  });

  test('should reset pagination to page 1 when new search is performed', async ({
    page,
  }) => {
    // 1. Start on page 2 directly
    await page.goto('/en/about-us/publications?page=2');
    await page.waitForLoadState('load');

    await expect(page).toHaveURL(/page=2/);

    const searchInput = page
      .locator('main')
      .getByPlaceholder('Search by title, authors, or journal...');
    await expect(searchInput).toBeVisible();

    // 2. Type "research"
    await searchInput.click();
    await searchInput.fill('research');

    // 3. Expect URL to update query and remove page parameter (which implies page 1)
    await expect(page).toHaveURL(/query=research/);
    await expect(page).not.toHaveURL(/page=/);
  });

  test('should allow clearing the search query and restore URL', async ({
    page,
  }) => {
    // 1. Start with a query
    await page.goto('/en/about-us/publications?query=biology');
    await page.waitForLoadState('load');

    const searchInput = page
      .locator('main')
      .getByPlaceholder('Search by title, authors, or journal...');
    await expect(searchInput).toHaveValue('biology');

    // 2. Clear the input
    await searchInput.click();
    await searchInput.fill('');

    // 3. Wait for debounce and ensure query is removed from URL
    await expect(page).not.toHaveURL(/query=/);
  });
});
