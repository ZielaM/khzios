import { test, expect } from '@playwright/test';

test.describe('Search Pagination Spec', () => {
  test.beforeEach(async ({ page }) => {
    // Set a large desktop viewport to keep controls fully visible by default
    await page.setViewportSize({ width: 1280, height: 800 });
    // Start on the English news list (has plenty of seeded items, 12 items per page)
    await page.goto('/en/news');
    await page.waitForLoadState('domcontentloaded');

    // CRITICAL: Wait for initial search synchronization debounce to stabilize URL state (sort=date)
    // to prevent race conditions during E2E testing
    await expect(page).toHaveURL(/sort=date/);
  });

  test('should disable previous button on page 1 and allow navigating to page 2', async ({
    page,
  }) => {
    // 1. Locate pagination navigation bar
    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();

    // 2. "Previous page" button should be disabled on the first page
    const prevButton = page.getByRole('button', { name: 'Previous page' });
    await expect(prevButton).toBeVisible();
    await expect(prevButton).toBeDisabled();

    // 3. Current page indicator (Page 1) should have aria-current="page"
    const page1Indicator = page.getByRole('button', { name: 'Page 1' });
    await expect(page1Indicator).toHaveAttribute('aria-current', 'page');

    // 4. Click on Page 2 button
    const page2Button = page.getByRole('button', { name: 'Page 2' });
    await expect(page2Button).toBeVisible();
    await page2Button.click();

    // 5. Expect the URL to update to page=2
    await expect(page).toHaveURL(/page=2/);

    // 6. On Page 2, Page 2 button should now show aria-current="page"
    await expect(page.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    // 7. On Page 2, the "Previous page" button should become active and enabled
    const activePrevButton = page.getByRole('button', {
      name: 'Previous page',
    });
    await expect(activePrevButton).not.toBeDisabled();
  });

  test('should navigate using previous and next pagination controls', async ({
    page,
  }) => {
    // 1. Start on page 2 directly
    await page.goto('/en/news?page=2&sort=date');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page load state to stabilize
    await expect(page).toHaveURL(/page=2/);

    // 2. Click "Previous page" button
    const prevButton = page.getByRole('button', { name: 'Previous page' });
    await prevButton.click();

    // 3. Expect URL to change back to page=1
    await expect(page).toHaveURL(/page=1/);

    // 4. Click "Next page" button
    const nextButton = page.getByRole('button', { name: 'Next page' });
    await nextButton.click();

    // 5. Expect URL to go back to page=2
    await expect(page).toHaveURL(/page=2/);
  });

  test('should allow going to last page dynamically and disable next button', async ({
    page,
  }) => {
    // 1. Wait for the pagination navigation bar to be visible
    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();

    // 2. Locate all numbered page buttons inside the pagination (filtering by numeric text)
    const numberedButtons = paginationNav
      .getByRole('button')
      .filter({ hasText: /^\d+$/ });

    // Wait for the first button to be visible to ensure DOM is fully hydrated/rendered
    await expect(numberedButtons.first()).toBeVisible();

    const count = await numberedButtons.count();
    expect(count).toBeGreaterThan(0);

    // 3. Select the last numbered page button
    const lastPageButton = numberedButtons.nth(count - 1);
    await expect(lastPageButton).toBeVisible();

    // 4. Extract the last page number dynamically from its text content
    const lastPageNumStr = await lastPageButton.textContent();
    const lastPageNumber = lastPageNumStr?.trim() || '';
    expect(lastPageNumber).not.toBe('');

    // 5. Click the last page button to navigate
    await lastPageButton.click();

    // 6. Expect URL to update to the last page number exactly
    await expect(page).toHaveURL(new RegExp(`page=${lastPageNumber}`));

    // 7. On the last page, the "Next page" button should be disabled
    const nextButton = page.getByRole('button', { name: 'Next page' });
    await expect(nextButton).toBeDisabled();

    // 8. On the last page, the "Previous page" button should be enabled
    const prevButton = page.getByRole('button', { name: 'Previous page' });
    await expect(prevButton).toBeEnabled();

    // 9. Click "Previous page" to go back
    await prevButton.click();

    // 10. Verify we successfully transitioned to the page before the last page
    const expectedPrevPage = Number(lastPageNumber) - 1;
    await expect(page).toHaveURL(new RegExp(`page=${expectedPrevPage}`));
  });
});
