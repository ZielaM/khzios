import { test, expect, Page } from '@playwright/test';

/** Navigate from the news listing to the Nth article (1-indexed). */
async function navigateToArticle(page: Page, position: number) {
  await page.goto('/en/news');
  await page.waitForLoadState('load');

  const item = page.getByRole('article').nth(position - 1);
  await expect(item).toBeVisible();
  await item.getByRole('link').first().click();

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
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'News' })
    ).toBeVisible();
    await expect(page.locator('article time').first()).toBeVisible();
    // Short article: no reading time
    await expect(page.getByText(/\d+ min read/)).toHaveCount(0);

    // Deterministic: article at position 1 has the "Swine Breeding" tag
    await expect(
      page.getByText('Swine Breeding', { exact: true })
    ).toBeVisible();
  });

  test('should navigate back to the news list via the breadcrumbs', async ({
    page,
  }) => {
    await navigateToArticle(page, 1);
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'News' })
      .click();

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
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    // Navigate to an article
    await page.getByRole('article').first().getByRole('link').first().click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
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
    // Mock clipboard API for cross-browser compatibility
    // (grantPermissions('clipboard-write') is only supported in Chromium)
    // We use addInitScript to ensure it's available before the page loads.
    await page.addInitScript(() => {
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

    await navigateToArticle(page, 1);

    const share = page.getByRole('button', { name: 'Share' });
    await share.click();
    await expect(share).toContainText('Link copied');
    // Also announced to screen readers
    await expect(page.getByRole('status')).toHaveText('Link copied');
  });

  // ─── Reading Progress ────────────────────────────────────────────
  // (Scroll update logic is covered by the ReadingProgress component tests.)

  test('shows no reading progress bar on a short article', async ({ page }) => {
    await navigateToArticle(page, 1);

    await expect(page.locator('[class*="progressBar"]')).toHaveCount(0);
  });

  // ─── Related Articles (Suspense streaming) ──────────────────────
  // (Rendering logic and HTML stripping covered by RelatedNews component tests)

  test('should load related articles via Suspense', async ({ page }) => {
    await navigateToArticle(page, 1);

    await expect(page.getByRole('heading', { name: 'Read also' })).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.locator('#related-news + div').getByRole('article').first()
    ).toBeVisible();
  });

  test('should navigate to a related article', async ({ page }) => {
    await navigateToArticle(page, 1);

    await expect(page.getByRole('heading', { name: 'Read also' })).toBeVisible({
      timeout: 30000,
    });

    const related = page
      .locator('#related-news + div')
      .getByRole('article')
      .first()
      .getByRole('link');
    const title = await related.textContent();
    await related.click();

    await expect(page).toHaveURL(/\/en\/news\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title!);
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

  test('offers a way back to the top after scrolling down', async ({
    page,
  }) => {
    await navigateToArticle(page, 1);
    const button = page.getByRole('button', { name: 'Scroll to top' });
    await expect(button).toBeHidden();
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 3000);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(300);
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});
