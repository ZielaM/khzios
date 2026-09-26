import { test, expect } from '@playwright/test';

test.describe('Contact Page Navigation Spec', () => {
  test.beforeEach(async ({ page }) => {
    // Set to standard desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('should navigate to Contact page via navbar and display contact info', async ({
    page,
  }) => {
    await page.goto('/en');
    await page.waitForLoadState('load');

    // Go to Contact via navbar
    const contactLink = page
      .locator('nav')
      .getByRole('link', { name: 'Contact', exact: true });
    await expect(contactLink).toBeVisible();
    await contactLink.click();

    await expect(page).toHaveURL(/\/en\/contact/);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();

    await expect(heading).toHaveText('Contact');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Contact', exact: true })
    ).toBeVisible();

    // Check for standard icons/labels rendered by ContactProfile
    await expect(page.getByText('Working hours')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Office' })).toBeVisible();

    // Google Maps loads only on request
    const mapIframe = page.locator('iframe[title^="Map"]');
    await expect(mapIframe).toHaveCount(0);
    await page.getByRole('button', { name: 'Show map' }).click();
    await expect(mapIframe).toBeVisible();
    await expect(mapIframe).toBeFocused();
  });
});
