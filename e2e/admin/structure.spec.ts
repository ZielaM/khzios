import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn } from './helpers';

test.describe('Admin panel: people and teams', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
  });

  test('builds a team page from new people and projects', async ({
    page,
    browserName,
  }) => {
    const stamp = `${browserName}${Date.now()}`;
    const lastName = `Testowa${stamp}`;
    const teamName = `Zespół testowy ${stamp}`;

    // Employee with a photo
    await page.goto(`${ADMIN_BASE}/employees/new`);
    await page.getByLabel('Imię').fill('Anna');
    await page.getByLabel('Nazwisko').fill(lastName);
    await page.locator('[name="academicTitle_pl"]').fill('dr');
    // Fields side by side line up even when one has a hint below
    const orcid = await page.getByLabel('ORCID').boundingBox();
    const slug = await page.getByLabel('Adres profilu').boundingBox();
    expect(Math.abs(orcid!.y - slug!.y)).toBeLessThan(1);
    const photo = await sharp({
      create: { width: 400, height: 400, channels: 3, background: '#789' },
    })
      .jpeg()
      .toBuffer();
    await page.locator('[name="photo"]').setInputFiles({
      name: 'portret.jpg',
      mimeType: 'image/jpeg',
      buffer: photo,
    });
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(page.getByText('Utworzono.')).toBeVisible();
    const employeeUrl = page.url().split('?')[0];

    // Team with a research description, the new member and a project
    await page.goto(`${ADMIN_BASE}/teams/new`);
    await page.locator('[name="name_pl"]').fill(teamName);
    await page
      .locator('[name="researchDescription_pl"]')
      .fill('Badamy testy końcowe.');
    await page.getByLabel('Kolejność w menu').fill('999');
    // The name is required in every language: the browser opens the first
    // tab that lacks it
    await expect(page.locator('[name="name_en"]')).toBeHidden();
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(page.locator('[name="name_en"]')).toBeVisible();
    const others = [
      ['en', 'Angielski'],
      ['uk', 'Ukraiński'],
      ['ru', 'Rosyjski'],
    ] as const;
    for (const [code, tab] of others) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
      await page.locator(`[name="name_${code}"]`).fill(`${teamName} ${code}`);
    }
    // A Polish description needs its translations as well (server check);
    // nothing typed is lost with the error
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(page.locator('form [role="alert"]')).toContainText(
      'uzupełnij je też w językach: angielski, ukraiński, rosyjski'
    );
    await expect(page.locator('[name="name_uk"]')).toHaveValue(
      `${teamName} uk`
    );
    for (const [code, tab] of others) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
      await page
        .locator(`[name="researchDescription_${code}"]`)
        .fill(`Research ${code}`);
    }
    await page.getByRole('button', { name: 'Utwórz' }).click();
    await expect(page.getByText('Utworzono zespół.')).toBeVisible();
    // Links are only shown for external teams
    await expect(
      page.getByRole('heading', { name: 'Linki zewnętrzne' })
    ).toHaveCount(0);
    const teamUrl = page.url().split('?')[0];

    await page
      .getByLabel('Pracownik')
      .selectOption({ label: `${lastName} Anna` });
    await page.getByRole('button', { name: 'Dodaj do zespołu' }).click();
    await expect(page.getByText('Dodano osobę do zespołu.')).toBeVisible();

    await page.locator('summary', { hasText: 'Dodaj projekt' }).click();
    const projectForm = page.locator('details', { hasText: 'Dodaj projekt' });
    await projectForm.getByLabel('Lata').fill('2024–');
    await projectForm.locator('[name="title_pl"]').fill(`Projekt ${stamp}`);
    await projectForm.getByRole('button', { name: 'Dodaj projekt' }).click();
    await expect(page.getByText('Dodano projekt.')).toBeVisible();

    // The public team page, straight away
    const publicHref = await page
      .getByRole('link', { name: 'Zobacz na stronie' })
      .getAttribute('href');
    await page.goto(publicHref!);
    await expect(
      page.getByRole('heading', { level: 1, name: teamName })
    ).toBeVisible();
    await expect(page.getByText('Badamy testy końcowe.')).toBeVisible();
    await expect(page.getByText(`Projekt ${stamp}`)).toBeVisible();
    await page.getByRole('link', { name: `Anna ${lastName}` }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: `Anna ${lastName}` })
    ).toBeVisible();

    // Clean up: both to the trash; the team page is gone
    await page.goto(teamUrl);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Przenieś do kosza' }).click();
    await expect(page.getByText('Zespół przeniesiono do kosza.')).toBeVisible();
    // A soft 404 (streamed page, status already sent): check the content
    const gone = await (await page.request.get(publicHref!)).text();
    expect(gone).not.toContain(teamName);
    expect(gone).toContain('noindex');

    await page.goto(employeeUrl);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Przenieś do kosza' }).click();
    await expect(
      page.getByText('Pracownika przeniesiono do kosza.')
    ).toBeVisible();
  });

  test('adds a publication to a team', async ({ page, browserName }) => {
    const title = `Publikacja e2e ${browserName} ${Date.now()}`;
    await page.goto(`${ADMIN_BASE}/publications`);
    await page.locator('summary', { hasText: 'Dodaj publikację' }).click();
    const form = page.locator('details', { hasText: 'Dodaj publikację' });
    await form.locator('[name="title_pl"]').fill(title);
    await form.getByLabel('Autorzy').fill('Testowa A., Próbny B.');
    await form.getByLabel('Czasopismo').fill('Journal of Tests');
    await form.getByLabel('Zespół').selectOption({
      label: 'Zespół chowu i hodowli zwierząt przeżuwających i oceny mleka',
    });
    await form.getByRole('button', { name: 'Dodaj publikację' }).click();
    await expect(page.getByText('Dodano publikację.')).toBeVisible();

    await page.goto('/pl/o-nas/struktura/przezuwajace');
    await expect(page.getByText(title)).toBeVisible();

    await page.goto(
      `${ADMIN_BASE}/publications?q=${encodeURIComponent(title)}`
    );
    await page
      .locator('details', { hasText: title })
      .locator('summary')
      .click();
    page.once('dialog', (d) => d.accept());
    await page
      .locator('details', { hasText: title })
      .getByRole('button', { name: 'Przenieś do kosza' })
      .click();
    await expect(page.locator('details', { hasText: title })).toHaveCount(0);
  });
});
