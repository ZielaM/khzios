import { test, expect } from '@playwright/test';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn } from './helpers';

// These change texts and settings shared by the whole site, so they run in
// one browser only
test.describe('Admin panel: settings and page texts', () => {
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('editors cannot open the settings', async ({ page }) => {
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await expect(page.getByRole('link', { name: 'Ustawienia' })).toHaveCount(0);
    const response = await page.goto(`${ADMIN_BASE}/settings`);
    expect(response?.status()).toBe(404);
  });

  test('the office phone changes in the footer', async ({ page }) => {
    await signIn(page, DEV_ADMIN_ACCOUNTS.admin);
    await page.goto(`${ADMIN_BASE}/settings`);
    const contact = page.getByRole('region', {
      name: 'Dane kontaktowe katedry',
    });
    await contact.getByLabel('Telefon').fill('+48 61 000 00 00');
    await contact.getByRole('button', { name: 'Zapisz' }).click();
    await expect(contact.getByText('Zapisano.')).toBeVisible();

    await page.goto('/pl/kontakt');
    await expect(
      page.locator('footer').getByRole('link', { name: '+48 61 000 00 00' })
    ).toBeVisible();

    // Back to the default
    await page.goto(`${ADMIN_BASE}/settings`);
    await contact.getByLabel('Telefon').fill('+48 61 848 72 45');
    await contact.getByRole('button', { name: 'Zapisz' }).click();
    await expect(contact.getByText('Zapisano.')).toBeVisible();
  });

  test('edits a page text and restores the default', async ({ page }) => {
    const text = `Opis katedry z panelu ${Date.now()}.`;
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/texts/AboutUsPage`);

    await page.locator('[name="overview_pl"]').fill(text);
    await page.getByRole('button', { name: 'Zapisz teksty' }).click();
    await expect(
      page.getByText(/Zapisano \(zmienionych tekstów: 1\)/)
    ).toBeVisible();

    await page.goto('/pl/o-nas');
    await expect(page.getByText(text)).toBeVisible();

    // A text that loses its link is refused
    await page.goto(`${ADMIN_BASE}/texts/AboutUsPage`);
    await page.locator('[name="workText_pl"]').fill('Tekst bez linku.');
    await page.getByRole('button', { name: 'Zapisz teksty' }).click();
    await expect(page.locator('form [role="alert"]')).toContainText(
      'Zachowaj znaczniki: <link>…</link>'
    );

    page.once('dialog', (d) => d.accept());
    await page
      .getByRole('button', { name: 'Przywróć teksty domyślne' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Przywróć teksty domyślne' })
    ).toHaveCount(0);
    await page.goto('/pl/o-nas');
    await expect(page.getByText(text)).toHaveCount(0);
  });
});
