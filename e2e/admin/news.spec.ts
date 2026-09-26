import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn } from './helpers';

test.describe('Admin panel: news', () => {
  test('creates a draft, publishes it with a photo and moves it to the trash', async ({
    page,
    browserName,
  }) => {
    const title = `Test e2e ${browserName} ${Date.now()}`;
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/news/new`);

    await page.getByLabel('Tytuł').first().fill(title);
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.pressSequentially('Treść artykułu testowego.');
    // An old date keeps the article away from the first page of the public
    // lists, which other tests rely on
    await page.getByLabel('Data publikacji').fill('2020-01-15');
    await page.getByRole('button', { name: 'Utwórz' }).click();

    await expect(page.getByRole('status')).toContainText('Utworzono artykuł');
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    const articleUrl = page.url();
    const id = articleUrl.split('/news/')[1].split('?')[0];

    // A draft is not on the site
    const draftResponse = await page.request.get(`/pl/aktualnosci/${id}`);
    expect(await draftResponse.text()).not.toContain(title);

    // Publish
    await page.getByLabel('Opublikowany (widoczny na stronie)').check();
    await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
    await expect(page.getByRole('status')).toContainText('widoczny na stronie');

    // A photo, first without a description
    const jpeg = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#3a7' },
    })
      .jpeg()
      .toBuffer();
    await page.getByLabel('Dodaj zdjęcia').setInputFiles({
      name: 'zdjecie-testowe.jpg',
      mimeType: 'image/jpeg',
      buffer: jpeg,
    });
    await page.getByRole('button', { name: 'Wgraj' }).click();
    await expect(page.getByText('Dodano zdjęcie.')).toBeVisible();
    await expect(page.getByText('Brak opisu po polsku.')).toBeVisible();

    await page
      .getByLabel('Opis zdjęcia (polski)')
      .fill('Zielony prostokąt testowy');
    await page.getByRole('button', { name: 'Zapisz opis' }).click();
    await expect(page.getByText('Zapisano opis.')).toBeVisible();

    // Visible on the site straight away (on-demand revalidation)
    await page.goto(`/pl/aktualnosci/${id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    await expect(page.getByText('Treść artykułu testowego.')).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Zielony prostokąt testowy' })
    ).toBeVisible();

    // To the trash
    await page.goto(articleUrl);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Przenieś do kosza' }).click();
    await expect(
      page.getByText('Artykuł przeniesiono do kosza.')
    ).toBeVisible();
    const gone = await page.request.get(`/pl/aktualnosci/${id}`);
    expect(await gone.text()).not.toContain(title);
  });

  test('requires the Polish title and content', async ({ page }) => {
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/news/new`);
    await page.getByLabel('Tytuł').first().fill('Tylko tytuł');
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(page.locator('form [role="alert"]')).toHaveText(
      'Tytuł i treść po polsku są wymagane.'
    );
  });
});
