import { test, expect } from '@playwright/test';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn } from './helpers';

test.describe('Admin panel: tags, drafts, external teams and the office', () => {
  test('a tag is added with its translations, offered in articles and removed', async ({
    page,
    browserName,
  }) => {
    const name = `Owce e2e ${browserName} ${Date.now()}`.slice(0, 50);
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/tags`);
    const form = page.getByRole('region', { name: 'Nowy tag' });
    await form.locator('[name="name_pl"]').fill(name);
    await form.locator('[name="name_en"]').fill(`${name} (en)`);
    await form.getByRole('button', { name: 'Dodaj tag' }).click();
    await expect(page.getByRole('heading', { name })).toBeVisible();

    await page.goto(`${ADMIN_BASE}/news/new`);
    await expect(page.getByLabel(name)).toBeVisible();

    await page.goto(`${ADMIN_BASE}/tags`);
    page.once('dialog', (d) => d.accept());
    await page
      .getByRole('region', { name: `Tag ${name}` })
      .getByRole('button', { name: /Usuń/ })
      .click();
    await expect(page.getByRole('heading', { name })).toHaveCount(0);
  });

  test('a draft can be previewed and its English version is used once published', async ({
    page,
    browserName,
  }) => {
    const stamp = `${browserName} ${Date.now()}`;
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/news/new`);
    await page.locator('[name="title_pl"]').fill(`Szkic ${stamp}`);
    await page.locator('.ProseMirror').first().click();
    await page.keyboard.type('Polska treść szkicu.');
    await page.getByRole('tab', { name: /^Angielski/ }).click();
    await page.locator('[name="title_en"]').fill(`Draft ${stamp}`);
    await page.locator('.ProseMirror').nth(1).click();
    await page.keyboard.type('English content of the draft.');
    await page.getByLabel('Data publikacji').fill('2020-01-16');
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: `Szkic ${stamp}` })
    ).toBeVisible();
    const editUrl = page.url().split('?')[0];
    const id = editUrl.split('/news/')[1];

    // The preview shows the unpublished article inside the panel
    await page.getByRole('link', { name: 'Podgląd' }).click();
    await expect(page).toHaveURL(/\/preview$/);
    await expect(page.getByText('Polska treść szkicu.')).toBeVisible();
    await expect(page.locator('.ProseMirror')).toHaveCount(0);

    await page.goto(editUrl);
    await page.getByLabel('Opublikowany (widoczny na stronie)').check();
    await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
    await expect(page.getByRole('status')).toContainText('widoczny na stronie');

    await page.goto(`/en/news/${id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: `Draft ${stamp}` })
    ).toBeVisible();
    await expect(page.getByText('English content of the draft.')).toBeVisible();
    // Ukrainian falls back to English first (uk → en → pl)
    await page.goto(`/uk/news/${id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: `Draft ${stamp}` })
    ).toBeVisible();
    await page.goto(`/pl/aktualnosci/${id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: `Szkic ${stamp}` })
    ).toBeVisible();

    await page.goto(editUrl);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Przenieś do kosza' }).click();
    await expect(
      page.getByText('Artykuł przeniesiono do kosza.')
    ).toBeVisible();
  });

  test('an external team shows the links added in the panel', async ({
    page,
    browserName,
  }) => {
    const stamp = `${browserName}${Date.now()}`;
    const name = `Zespół zewnętrzny ${stamp}`;
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/teams/new`);
    for (const [code, tab] of [
      ['pl', 'Polski'],
      ['en', 'Angielski'],
      ['uk', 'Ukraiński'],
      ['ru', 'Rosyjski'],
    ]) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
      await page.locator(`[name="name_${code}"]`).fill(`${name} ${code}`);
    }
    await page.getByLabel('Rodzaj').selectOption('EXTERNAL');
    await page.getByLabel('Kolejność w menu').fill('999');
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(page.getByText('Utworzono zespół.')).toBeVisible();
    const teamUrl = page.url().split('?')[0];

    await page.locator('summary', { hasText: 'Dodaj link' }).click();
    const linkForm = page.locator('details', { hasText: 'Dodaj link' });
    await linkForm.getByLabel('Adres').fill('https://example.org/zespol');
    await linkForm.locator('[name="label_pl"]').fill('Strona zespołu');
    await linkForm.getByRole('button', { name: 'Dodaj link' }).click();
    await expect(page.getByText('Dodano link.')).toBeVisible();

    const publicHref = await page
      .getByRole('link', { name: 'Zobacz na stronie' })
      .getAttribute('href');
    await page.goto(publicHref!);
    const link = page.getByRole('link', { name: /Strona zespołu/ });
    await expect(link).toHaveAttribute('href', 'https://example.org/zespol');
    await expect(link).toHaveAttribute('target', '_blank');

    await page.goto(teamUrl);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Przenieś do kosza' }).click();
    await expect(page.getByText('Zespół przeniesiono do kosza.')).toBeVisible();
  });

  test('office hours edited in the panel appear on the contact page', async ({
    page,
    browserName,
  }) => {
    // Shared by the whole site, so one browser only
    test.skip(browserName !== 'chromium');
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
    await page.goto(`${ADMIN_BASE}/office`);
    const office = page.getByRole('region', { name: 'Sekretariat' });
    const monday = office.getByLabel('Poniedziałek');
    const original = await monday.inputValue();

    await monday.fill('07:15 - 15:15');
    await office.getByRole('button', { name: 'Zapisz' }).click();
    await expect(office.getByRole('status')).toBeVisible();
    await page.goto('/pl/kontakt');
    await expect(page.getByText('07:15 - 15:15')).toBeVisible();

    await page.goto(`${ADMIN_BASE}/office`);
    await office.getByLabel('Poniedziałek').fill(original);
    await office.getByRole('button', { name: 'Zapisz' }).click();
    await expect(office.getByRole('status')).toBeVisible();
  });
});
