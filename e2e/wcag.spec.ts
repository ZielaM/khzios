import { test, expect } from '@playwright/test';

test.describe('WCAG Accessibility Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Set a large desktop viewport to keep controls inline by default
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/en/news');
    await page.waitForLoadState('load');

    // Robust toggle: if settings are collapsed inside a dropdown panel, expand them
    const settingsToggle = page.getByRole('button', {
      name: 'Accessibility settings',
    });
    if (await settingsToggle.isVisible()) {
      await settingsToggle.click();
    }
  });

  test('should toggle high contrast mode and persist in localStorage and across reloads', async ({
    page,
  }) => {
    const html = page.locator('html');

    // 1. Initial State: No high contrast class
    await expect(html).not.toHaveClass(/wcag-high-contrast/);

    // 2. Locate high contrast toggle button using the English title from en.json
    const contrastBtn = page.locator('button[title="Toggle high contrast"]');
    await expect(contrastBtn).toBeVisible();

    // 3. Click to enable high contrast
    await contrastBtn.click();
    await expect(html).toHaveClass(/wcag-high-contrast/);

    // 4. Verify high contrast is saved in localStorage
    const savedContrastValue = await page.evaluate(() =>
      localStorage.getItem('wcag-high-contrast')
    );
    expect(savedContrastValue).toBe('true');

    // 5. Reload the page and ensure the high contrast class persists from localStorage
    await page.reload();
    await page.waitForLoadState('load');
    await expect(html).toHaveClass(/wcag-high-contrast/);

    // Re-expand settings dropdown after reload if compact layout is active
    const settingsToggle = page.getByRole('button', {
      name: 'Accessibility settings',
    });
    if (await settingsToggle.isVisible()) {
      await settingsToggle.click();
    }

    // 6. Click again to disable high contrast
    const reloadContrastBtn = page.locator(
      'button[title="Toggle high contrast"]'
    );
    await reloadContrastBtn.click();
    await expect(html).not.toHaveClass(/wcag-high-contrast/);

    // 7. Verify localStorage reflects the toggled off state
    const postContrastValue = await page.evaluate(() =>
      localStorage.getItem('wcag-high-contrast')
    );
    expect(postContrastValue).toBe('false');
  });

  test('should dynamically scale font size, modify CSS variable and persist value', async ({
    page,
  }) => {
    const html = page.locator('html');

    // 1. Locate increase/decrease font buttons using English titles
    const increaseBtn = page.locator('button[title="Increase font size"]');
    const decreaseBtn = page.locator('button[title="Decrease font size"]');

    await expect(increaseBtn).toBeVisible();
    await expect(decreaseBtn).toBeVisible();

    // 2. Initial state: style should not contain --wcag-font-scale
    const initialStyle = await html.getAttribute('style');
    expect(initialStyle || '').not.toContain('--wcag-font-scale');

    // 3. Click to increase font (should scale to 1.1)
    await increaseBtn.click();
    await expect(html).toHaveAttribute('style', /--wcag-font-scale:\s*1\.1/);

    // 4. Verify localStorage has updated offset
    let savedOffset = await page.evaluate(() =>
      localStorage.getItem('wcag-font-offset')
    );
    expect(savedOffset).toBe('1');

    // 5. Click to increase again (should scale to 1.2)
    // Scale 1.2 effective width is 1280/1.2 = 1066px (still > 1024px, not collapsed)
    await increaseBtn.click();
    await expect(html).toHaveAttribute('style', /--wcag-font-scale:\s*1\.2/);

    savedOffset = await page.evaluate(() =>
      localStorage.getItem('wcag-font-offset')
    );
    expect(savedOffset).toBe('2');

    // 6. Reload page and check if style scaling is preserved from localStorage
    await page.reload();
    await page.waitForLoadState('load');

    // Re-expand settings dropdown after reload if compact layout is active
    const settingsToggle = page.getByRole('button', {
      name: 'Accessibility settings',
    });
    if (await settingsToggle.isVisible()) {
      await settingsToggle.click();
    }

    await expect(html).toHaveAttribute('style', /--wcag-font-scale:\s*1\.2/);

    // 7. Decrease font size back to normal
    const reloadDecreaseBtn = page.locator(
      'button[title="Decrease font size"]'
    );
    await reloadDecreaseBtn.click(); // scale 1.1
    await reloadDecreaseBtn.click(); // scale 1.0 (removes property)

    const finalStyle = await html.getAttribute('style');
    expect(finalStyle || '').not.toContain('--wcag-font-scale');

    savedOffset = await page.evaluate(() =>
      localStorage.getItem('wcag-font-offset')
    );
    expect(savedOffset).toBe('0');
  });

  test('should trigger compact layout on extreme font scale to avoid horizontal scroll', async ({
    page,
  }) => {
    const html = page.locator('html');
    const increaseBtn = page.locator('button[title="Increase font size"]');

    // 1. Initial State: Screen width is standard desktop, no compact-layout
    await expect(html).not.toHaveClass(/compact-layout/);

    // 2. Click 6 times to reach maximum offset (1.6x scale)
    for (let i = 0; i < 6; i++) {
      // Re-expand settings dropdown if scaling triggers compact-layout and hides controls
      const settingsToggle = page.getByRole('button', {
        name: 'Accessibility settings',
      });
      if (await settingsToggle.isVisible()) {
        const expanded = await settingsToggle.getAttribute('aria-expanded');
        if (expanded !== 'true') {
          await settingsToggle.click();
        }
      }
      await increaseBtn.click();
    }

    // 3. Since scale is 1.6, effective screen width drops below 1024px, triggering compact-layout class
    await expect(html).toHaveClass(/compact-layout/);
  });
});
