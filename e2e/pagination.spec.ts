import { test, expect } from '@playwright/test';

test.describe('Search Pagination Spec', () => {
  test.beforeEach(async ({ page }) => {
    // Set a large desktop viewport to keep controls fully visible by default
    await page.setViewportSize({ width: 1280, height: 800 });
    // Start on the English publications list since it natively uses standard pagination
    await page.goto('/en/about-us/publications');
    await page.waitForLoadState('load');
  });

  test('should link to page 2 and mark the current page', async ({ page }) => {
    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();

    // There is no previous page on page 1
    await expect(
      paginationNav.getByRole('link', { name: 'Previous page' })
    ).toHaveCount(0);
    await expect(
      paginationNav.getByRole('link', { name: 'Page 1' })
    ).toHaveAttribute('aria-current', 'page');

    await paginationNav.getByRole('link', { name: 'Page 2' }).click();

    await expect(page).toHaveURL(/page=2/);
    await expect(
      paginationNav.getByRole('link', { name: 'Page 2' })
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      paginationNav.getByRole('link', { name: 'Previous page' })
    ).toBeVisible();
  });

  test('should navigate using previous and next links', async ({ page }) => {
    await page.goto('/en/about-us/publications?page=2');
    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });

    await paginationNav.getByRole('link', { name: 'Previous page' }).click();
    await expect(page).not.toHaveURL(/page=/);

    await paginationNav.getByRole('link', { name: 'Next page' }).click();
    await expect(page).toHaveURL(/page=2/);
  });

  test('should reach the last page, which has no next link', async ({
    page,
  }) => {
    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    const numbered = paginationNav
      .getByRole('link')
      .filter({ hasText: /^\d+$/ });
    await expect(numbered.first()).toBeVisible();

    const lastPageNumber = ((await numbered.last().textContent()) ?? '').trim();
    expect(lastPageNumber).not.toBe('');

    await numbered.last().click();
    await expect(page).toHaveURL(new RegExp(`page=${lastPageNumber}`));

    await expect(
      paginationNav.getByRole('link', { name: 'Next page' })
    ).toHaveCount(0);

    await paginationNav.getByRole('link', { name: 'Previous page' }).click();
    await expect(page).toHaveURL(
      new RegExp(`page=${Number(lastPageNumber) - 1}`)
    );
  });

  test('should not overflow on mobile viewports', async ({ page }) => {
    // 1. Set a narrow mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. Ensure the pagination is visible
    const paginationNav = page.getByRole('navigation', { name: 'Pagination' });
    await expect(paginationNav).toBeVisible();

    // 3. Check if the document has horizontal scroll (which indicates overflow)
    const hasHorizontalScroll = await page.evaluate(() => {
      // Allow a small 1px margin of error for fractional pixel rounding
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
      );
    });
    expect(hasHorizontalScroll).toBe(false);

    // 4. Also check the bounding box of the pagination specifically
    const box = await paginationNav.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // The right edge of the pagination should not exceed the viewport width
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    }
  });
});
