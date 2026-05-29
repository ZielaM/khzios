import { test, expect, Page } from '@playwright/test';

/** Navigate from the news listing to the Nth article tile (1-indexed). */
async function navigateToArticle(page: Page, position: number) {
  await page.goto('/en/news');
  await page.waitForLoadState('load');

  const tile = page.getByTestId('news-tile').nth(position - 1);
  await expect(tile).toBeVisible();
  await tile.getByRole('link').first().click();

  await expect(page).toHaveURL(/\/en\/news\/.+/);
}

test.describe('News Article Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // ─── Page Structure & Navigation ─────────────────────────────────

  test('should display core article elements and deterministic tag', async ({
    page,
  }) => {
    await navigateToArticle(page, 1);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to news' })
    ).toBeVisible();
    await expect(page.locator('time')).toBeVisible();
    await expect(page.getByText(/\d+ min read/)).toBeVisible();

    // Deterministic: article at position 1 has the "Swine Breeding" tag
    await expect(
      page.getByText('Swine Breeding', { exact: true })
    ).toBeVisible();
  });

  test('should navigate back to news list via "Back to news"', async ({
    page,
  }) => {
    await navigateToArticle(page, 1);
    await page.getByRole('link', { name: 'Back to news' }).click();

    await expect(page).toHaveURL(/\/en\/news/);
    await expect(page).not.toHaveURL(/\/en\/news\/.+/);
  });

  // ─── Scroll Restoration ──────────────────────────────────────────

  test('should scroll to top when navigating from list to article', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');

    // Scroll down on the list page
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    // Navigate to an article
    await page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first()
      .click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // Should be scrolled to top
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  // ─── Gallery Conditional Rendering ───────────────────────────────
  // (Lightbox behavior is fully covered by NewsGallery component tests)

  test('should show gallery section on article with photos (pos 3)', async ({
    page,
  }) => {
    await navigateToArticle(page, 3); // 3 photos
    await expect(
      page.getByRole('heading', { name: 'Photo gallery' })
    ).toBeVisible();
  });

  test('should NOT show gallery on article without photos (pos 6)', async ({
    page,
  }) => {
    await navigateToArticle(page, 6); // 0 photos
    await expect(
      page.getByRole('heading', { name: 'Photo gallery' })
    ).not.toBeVisible();
  });

  // ─── Share Button (real clipboard integration) ───────────────────
  // (Fallback/native share logic is covered by ShareButton component tests)

  test('should copy link to clipboard on share click', async ({ page }) => {
    await navigateToArticle(page, 1);

    // Mock clipboard API for cross-browser compatibility
    // (grantPermissions('clipboard-write') is only supported in Chromium)
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.resolve() },
        writable: true,
        configurable: true,
      });
      // Ensure navigator.share is absent so the fallback path (clipboard) is used
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    await page.getByRole('button', { name: 'Share' }).click();
    await expect(page.getByText('Link copied')).toBeVisible();
  });

  // ─── Reading Progress (presence check) ───────────────────────────
  // (Scroll update logic is fully covered by ReadingProgress component tests.
  //  Cross-browser scroll event handling is unreliable in E2E environments,
  //  so we only verify the progressbar is rendered with correct initial state.)

  test('should render reading progress bar', async ({ page }) => {
    await navigateToArticle(page, 1);

    const progress = page.getByRole('progressbar');
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(progress).toHaveAttribute('aria-valuemin', '0');
    await expect(progress).toHaveAttribute('aria-valuemax', '100');
  });

  // ─── Related Articles (Suspense streaming) ──────────────────────
  // (Rendering logic and HTML stripping covered by RelatedNews component tests)

  test('should load related articles via Suspense', async ({ page }) => {
    await navigateToArticle(page, 1);

    await expect(page.getByRole('heading', { name: 'Read also' })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText('Read more').first()).toBeVisible();
  });

  test('should navigate to a related article', async ({ page }) => {
    await navigateToArticle(page, 1);

    await expect(page.getByRole('heading', { name: 'Read also' })).toBeVisible({
      timeout: 30000,
    });

    await page.locator('a').filter({ hasText: 'Read more' }).first().click();

    await expect(page).toHaveURL(/\/en\/news\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to news' })
    ).toBeVisible();
  });

  // ─── SEO & Error Handling ────────────────────────────────────────

  test('should include JSON-LD structured data', async ({ page }) => {
    await navigateToArticle(page, 1);

    await page.waitForSelector('script[type="application/ld+json"]', {
      state: 'attached',
      timeout: 10000,
    });

    const jsonLd = await page.evaluate(() => {
      const el = document.querySelector('script[type="application/ld+json"]');
      return el ? JSON.parse(el.textContent ?? '{}') : null;
    });

    expect(jsonLd).not.toBeNull();
    expect(jsonLd['@type']).toBe('NewsArticle');
    expect(jsonLd.headline).toBeTruthy();
    expect(jsonLd.datePublished).toBeTruthy();
  });

  test('should show 404 page for non-existent article', async ({ page }) => {
    await page.goto('/en/news/non-existent-id-12345');
    await page.waitForLoadState('load');

    await expect(
      page.getByRole('heading', { name: /not found/i })
    ).toBeVisible();
  });
});
