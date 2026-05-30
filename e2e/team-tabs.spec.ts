import { test, expect } from '@playwright/test';

test.describe('Team Page Tabs Spec', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('should toggle between Publications and Research Projects tabs if both exist', async ({
    page,
  }) => {
    // Navigating to a specific team page (e.g., swine breeding team)
    // This relies on seeded data. If the team slug changes, this URL might need an update.
    await page.goto('/en/about-us/structure/swine');
    await page.waitForLoadState('load');

    // These names match the English translations for the tabs
    const pubTab = page.getByRole('button', {
      name: 'Publications',
      exact: true,
    });
    const projTab = page.getByRole('button', {
      name: 'Research Projects',
      exact: true,
    });

    // We use a conditional check in case the seed data for this team doesn't have both types of records
    const hasPubs = await pubTab.isVisible();
    const hasProj = await projTab.isVisible();

    if (hasPubs && hasProj) {
      // By default Publications should be active if it exists
      await expect(pubTab).toHaveClass(/active/);
      await expect(projTab).not.toHaveClass(/active/);

      // Click on Projects robustly (handling hydration delays)
      await expect(async () => {
        await projTab.click();
        await expect(projTab).toHaveClass(/active/, { timeout: 1000 });
      }).toPass();

      await expect(pubTab).not.toHaveClass(/active/);

      // Click back on Publications robustly
      await expect(async () => {
        await pubTab.click();
        await expect(pubTab).toHaveClass(/active/, { timeout: 1000 });
      }).toPass();
    } else if (hasPubs) {
      // If only publications exist, it should be active and the other should not be visible
      await expect(pubTab).toHaveClass(/active/);
      await expect(projTab).not.toBeVisible();
    } else if (hasProj) {
      // If only projects exist, it should be active
      await expect(projTab).toHaveClass(/active/);
      await expect(pubTab).not.toBeVisible();
    }
  });
});
