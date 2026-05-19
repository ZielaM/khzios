import { test, expect } from '@playwright/test';

/**
 * E2E tests for the News Article Detail Page (/news/[id]).
 *
 * These tests verify the full user journey: navigating from the news list
 * to a single article, interacting with on-page UI elements (gallery,
 * share button, reading progress, scroll-to-top, related articles),
 * and validating scroll restoration behavior and SEO metadata.
 *
 * All tests rely on seeded data (100 articles via prisma/seed.ts).
 */

test.describe('News Article Detail Page Spec', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // ─── Navigation & Page Structure ─────────────────────────────────

  test('should navigate from news list to an article and display core elements', async ({
    page,
  }) => {
    // 1. Start on the English news listing
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    // 2. Click the first article tile link
    const firstTile = page.getByTestId('news-tile').first();
    await expect(firstTile).toBeVisible();
    const firstLink = firstTile.getByRole('link').first();
    await firstLink.click();

    // 3. Verify we navigated to an article detail page
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // 4. Core structure: H1 title, article content, "Back to news" link
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    const backLink = page.getByRole('link', { name: 'Back to news' });
    await expect(backLink).toBeVisible();

    // 5. Metadata section: date and reading time
    const timeElement = page.locator('time');
    await expect(timeElement).toBeVisible();

    // Reading time contains "min read"
    await expect(page.getByText(/\d+ min read/)).toBeVisible();
  });

  test('should display tags on articles that have them', async ({ page }) => {
    // Navigate to the news list and click the first article
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstTile = page.getByTestId('news-tile').first();
    const firstLink = firstTile.getByRole('link').first();
    await firstLink.click();

    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // All seeded articles have 1-3 tags, so we expect at least one tag
    // Tags are rendered as <span> elements inside a tags container
    const tags = page
      .locator('span')
      .filter({
        hasText:
          /Swine Breeding|Product Evaluation|Poultry|Fur Animals|Events|Publications|Research/,
      });
    await expect(tags.first()).toBeVisible();
  });

  // ─── "Back to news" Navigation ───────────────────────────────────

  test('should navigate back to the news list via the "Back to news" link', async ({
    page,
  }) => {
    // 1. Navigate to an article directly
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // 2. Click the "Back to news" link
    const backLink = page.getByRole('link', { name: 'Back to news' });
    await backLink.click();

    // 3. We should be back on the news listing page
    await expect(page).toHaveURL(/\/en\/news/);
    await expect(page).not.toHaveURL(/\/en\/news\/.+/);
  });

  // ─── Scroll Restoration ──────────────────────────────────────────

  test('should scroll to top when navigating from news list to article', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    // 1. Scroll down the news list page to simulate a mid-page position
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(200);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(0);

    // 2. Click an article tile
    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // 3. Verify the page scrolled to the top
    await page.waitForTimeout(500);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBe(0);
  });

  // ─── Share Button ────────────────────────────────────────────────

  test('should show "Share" button and copy link on click', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // 1. Share button should be visible
    const shareButton = page.getByRole('button', { name: 'Share' });
    await expect(shareButton).toBeVisible();

    // 2. Grant clipboard permissions and click share
    await page.context().grantPermissions(['clipboard-write']);
    await shareButton.click();

    // 3. After clicking, the button text should change to "Link copied"
    await expect(page.getByText('Link copied')).toBeVisible();
  });

  // ─── Reading Progress Bar ────────────────────────────────────────

  test('should display reading progress bar and update on scroll', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // 1. Progress bar should be present
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toBeVisible();

    // 2. Initially at 0%
    await expect(progressBar).toHaveAttribute('aria-valuenow', '0');

    // 3. Scroll down and verify progress increased
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const valueNow = await progressBar.getAttribute('aria-valuenow');
    expect(Number(valueNow)).toBeGreaterThan(0);
  });

  // ─── Scroll To Top Button ───────────────────────────────────────

  test('should show scroll-to-top button after scrolling down and scroll up on click', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    const scrollBtn = page.getByRole('button', { name: 'Scroll to top' });

    // 1. Should NOT be visible initially (at top)
    await expect(scrollBtn).not.toBeVisible();

    // 2. Scroll down using mouse.wheel to reliably trigger the scroll event listener
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(1000);
    await expect(scrollBtn).toBeVisible({ timeout: 10000 });

    // 3. Click it — page should scroll back to top
    await scrollBtn.click();
    await page.waitForTimeout(1000);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);
  });

  // ─── Photo Gallery ──────────────────────────────────────────────

  test('should open and close the photo gallery lightbox', async ({ page }) => {
    // We need an article with photos. Seeded articles with index % 6 != 0 have photos.
    // Navigate to the listing and find one with a gallery section.
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    // Click the first tile (most recent articles have photos)
    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // Check if the "Photo gallery" heading exists on this article
    const galleryHeading = page.getByRole('heading', { name: 'Photo gallery' });
    const hasGallery = await galleryHeading.isVisible().catch(() => false);

    if (hasGallery) {
      // 1. Click the first gallery thumbnail button
      const gallerySection = page
        .locator('section')
        .filter({ has: galleryHeading });
      const firstThumb = gallerySection.getByRole('button').first();
      await firstThumb.click();

      // 2. Lightbox dialog should appear
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 3. Image counter should show "Image 1 of N"
      await expect(page.getByText(/Image 1 of \d+/)).toBeVisible();

      // 4. Close the lightbox via the Close button
      const closeBtn = page.getByRole('button', { name: 'Close gallery' });
      await closeBtn.click();
      await expect(dialog).not.toBeVisible();
    }
  });

  test('should navigate gallery images with keyboard arrows', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    const galleryHeading = page.getByRole('heading', { name: 'Photo gallery' });
    const hasGallery = await galleryHeading.isVisible().catch(() => false);

    if (hasGallery) {
      // Open the first thumbnail
      const gallerySection = page
        .locator('section')
        .filter({ has: galleryHeading });
      const firstThumb = gallerySection.getByRole('button').first();
      await firstThumb.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 1. Should start at "Image 1 of N"
      await expect(page.getByText(/Image 1 of \d+/)).toBeVisible();

      // 2. Press ArrowRight to advance to image 2
      await page.keyboard.press('ArrowRight');
      await expect(page.getByText(/Image 2 of \d+/)).toBeVisible();

      // 3. Press ArrowLeft to go back to image 1
      await page.keyboard.press('ArrowLeft');
      await expect(page.getByText(/Image 1 of \d+/)).toBeVisible();

      // 4. Press Escape to close the lightbox
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    }
  });

  // ─── Related Articles ────────────────────────────────────────────

  test('should display "Read also" section with related articles', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // "Read also" section heading should load (potentially via Suspense)
    const relatedHeading = page.getByRole('heading', { name: 'Read also' });
    await expect(relatedHeading).toBeVisible({ timeout: 10000 });

    // There should be at least one "Read more" link in the related section
    const readMoreLinks = page.getByText('Read more');
    await expect(readMoreLinks.first()).toBeVisible();
  });

  test('should navigate to a related article from the "Read also" section', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // Wait for the related articles to load
    const relatedHeading = page.getByRole('heading', { name: 'Read also' });
    await expect(relatedHeading).toBeVisible({ timeout: 10000 });

    // Click the first related article link
    const relatedLink = page
      .locator('a')
      .filter({ hasText: 'Read more' })
      .first();
    await relatedLink.click();

    // The clicked link should have navigated to an article detail page
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // The new article should also have a heading and the "Back to news" link
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Back to news' })
    ).toBeVisible();
  });

  // ─── SEO & Structured Data ──────────────────────────────────────

  test('should include JSON-LD structured data for the article', async ({
    page,
  }) => {
    await page.goto('/en/news');
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(/sort=date/);

    const firstLink = page
      .getByTestId('news-tile')
      .first()
      .getByRole('link')
      .first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/en\/news\/.+/);

    // Wait for the JSON-LD script tag to be attached to the DOM
    // Script tags are never 'visible' — they are hidden elements by nature
    await page.waitForSelector('script[type="application/ld+json"]', {
      state: 'attached',
      timeout: 10000,
    });

    // Extract the JSON-LD script content
    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector(
        'script[type="application/ld+json"]'
      );
      return script ? JSON.parse(script.textContent ?? '{}') : null;
    });

    expect(jsonLd).not.toBeNull();
    expect(jsonLd['@type']).toBe('NewsArticle');
    expect(jsonLd.headline).toBeTruthy();
    expect(jsonLd.datePublished).toBeTruthy();
    expect(jsonLd.author['@type']).toBe('Organization');
  });

  // ─── 404 Handling ───────────────────────────────────────────────

  test('should show not-found page for a non-existent article ID', async ({
    page,
  }) => {
    // Navigate to an article with a clearly fake ID
    await page.goto('/en/news/non-existent-article-id-12345');
    await page.waitForLoadState('load');

    // The page should render a 404 state (Next.js notFound())
    // Use the specific heading to avoid strict mode violation (title tag also matches)
    await expect(
      page.getByRole('heading', { name: /not found/i })
    ).toBeVisible();
  });
});
