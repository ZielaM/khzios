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

    const image = (background: string) =>
      sharp({ create: { width: 800, height: 600, channels: 3, background } })
        .jpeg()
        .toBuffer();

    await page.getByLabel('Tytuł').first().fill(title);
    // Only the active language is shown
    await expect(page.locator('[name="title_en"]')).toBeHidden();
    await page.getByRole('tab', { name: /^Angielski/ }).click();
    await expect(page.locator('[name="title_en"]')).toBeVisible();
    await page.getByRole('tab', { name: /^Polski/ }).click();

    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await editor.pressSequentially('Treść artykułu testowego.');
    // An old date keeps the article away from the first page of the public
    // lists, which other tests rely on
    await page.getByLabel('Data publikacji').fill('2020-01-15');
    // A photo right away, without a description yet
    await page.getByLabel('Zdjęcia (opcjonalnie)').setInputFiles({
      name: 'zdjecie-testowe.jpg',
      mimeType: 'image/jpeg',
      buffer: await image('#3a7'),
    });
    await page.getByRole('button', { name: 'Utwórz' }).click();

    await expect(page.getByRole('status')).toContainText(
      'Utworzono artykuł. Uzupełnij opisy zdjęć'
    );
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    await expect(page.getByText('Brak opisu po polsku.')).toBeVisible();
    const articleUrl = page.url();
    const id = articleUrl.split('/news/')[1].split('?')[0];

    // A draft is not on the site
    const draftResponse = await page.request.get(`/pl/aktualnosci/${id}`);
    expect(await draftResponse.text()).not.toContain(title);

    // Publish; the confirmation fades out after a few seconds
    await page.getByLabel('Opublikowany (widoczny na stronie)').check();
    await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
    const saved = page.getByRole('status');
    await expect(saved).toContainText('widoczny na stronie');
    await expect(saved).toBeHidden({ timeout: 10_000 });

    // A second photo, moved to the front
    await page.getByLabel('Dodaj zdjęcia').setInputFiles({
      name: 'drugie-zdjecie.jpg',
      mimeType: 'image/jpeg',
      buffer: await image('#a37'),
    });
    await page.getByRole('button', { name: 'Wgraj' }).click();
    await expect(page.getByText('Dodano zdjęcie.')).toBeVisible();
    const thumbnails = page.locator('section[aria-labelledby="photos"] img');
    const second = await thumbnails.nth(1).getAttribute('src');
    await page.getByRole('button', { name: 'Przesuń zdjęcie 2 wyżej' }).click();
    await expect(thumbnails.first()).toHaveAttribute('src', second!);

    await page
      .getByLabel('Opis zdjęcia (polski)')
      .first()
      .fill('Różowy prostokąt testowy');
    await page.getByRole('button', { name: 'Zapisz opis' }).first().click();
    await expect(page.getByText('Zapisano opis.')).toBeVisible();

    // Visible on the site straight away (on-demand revalidation)
    await page.goto(`/pl/aktualnosci/${id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    await expect(page.getByText('Treść artykułu testowego.')).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Różowy prostokąt testowy' }).first()
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

  test('the list filters sit on one line', async ({ page }) => {
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/news`);
    const boxes = await Promise.all(
      [
        page.getByLabel('Szukaj w tytułach'),
        page.getByLabel('Status'),
        page.getByRole('button', { name: 'Filtruj' }),
      ].map((l) => l.boundingBox())
    );
    for (const box of boxes.slice(1)) {
      expect(Math.abs(box!.y - boxes[0]!.y)).toBeLessThan(1);
      expect(Math.abs(box!.height - boxes[0]!.height)).toBeLessThan(1);
    }
  });

  test('requires the Polish title and content', async ({ page }) => {
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/news/new`);
    await page.getByLabel('Tytuł').first().fill('Tylko tytuł');
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(page.locator('form [role="alert"]')).toHaveText(
      'Tytuł i treść po polsku są wymagane.'
    );
    // The error does not clear what was typed
    await expect(page.getByLabel('Tytuł').first()).toHaveValue('Tylko tytuł');
  });
});
