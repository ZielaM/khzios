import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn } from './helpers';

test.describe('Admin panel: section photos', () => {
  test('a team banner uploaded in the panel appears on the team page', async ({
    page,
    browserName,
  }) => {
    // All browsers would upload to the same section, whose first photo counts
    test.skip(browserName !== 'chromium');
    const alt = `Baner zespołu ${Date.now()}`;
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/images`);

    const section = page.getByRole('region', {
      name: 'Zespół: Zespół chowu i hodowli trzody chlewnej',
    });
    const jpeg = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: '#a63' },
    })
      .jpeg()
      .toBuffer();
    await section.locator('[name="photos"]').setInputFiles({
      name: 'baner.jpg',
      mimeType: 'image/jpeg',
      buffer: jpeg,
    });
    await section.getByRole('button', { name: 'Wgraj', exact: true }).click();
    await expect(section.getByText('Dodano zdjęcie.')).toBeVisible();
    await section.getByLabel('Opis zdjęcia (polski)').fill(alt);
    await section.getByRole('button', { name: 'Zapisz opis' }).click();
    await expect(section.getByText('Zapisano opis.')).toBeVisible();

    await page.goto('/pl/o-nas/struktura/trzoda');
    await expect(page.getByRole('img', { name: alt })).toBeVisible();

    await page.goto(`${ADMIN_BASE}/images`);
    page.once('dialog', (d) => d.accept());
    await section.getByRole('button', { name: 'Usuń' }).click();
    await expect(section.getByRole('button', { name: 'Usuń' })).toHaveCount(0);
    await page.goto('/pl/o-nas/struktura/trzoda');
    await expect(page.getByRole('img', { name: alt })).toHaveCount(0);
  });
});
