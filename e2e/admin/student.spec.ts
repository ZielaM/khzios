import { test, expect } from '@playwright/test';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn } from './helpers';

const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
});

test.describe('Admin panel: student zone', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, DEV_ADMIN_ACCOUNTS.editor);
  });

  test('an announcement shows up in the live schedule at once', async ({
    page,
    browserName,
  }) => {
    const title = `Ogłoszenie e2e ${browserName} ${Date.now()}`.slice(0, 100);
    await page.goto(`${ADMIN_BASE}/student/announcements`);
    const form = page.locator('section', { hasText: 'Nowe ogłoszenie' });
    await form.locator('[name="title_pl"]').fill(title);
    await form.locator('[name="content_pl"]').fill('Zajęcia odwołane.');
    await form.getByRole('button', { name: 'Dodaj ogłoszenie' }).click();
    await expect(page.getByText('Dodano ogłoszenie.')).toBeVisible();

    const schedule = await (
      await page.request.get('/api/student-schedule')
    ).text();
    expect(schedule).toContain(title);

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
    expect(
      await (await page.request.get('/api/student-schedule')).text()
    ).not.toContain(title);
  });

  test('adds a weekly consultation slot', async ({ page, browserName }) => {
    const room = `sala e2e ${browserName} ${Date.now()}`;
    await page.goto(`${ADMIN_BASE}/student/consultations`);
    const form = page.locator('section', { hasText: 'Nowy termin' });
    await form.getByLabel('Pracownik').selectOption({ index: 1 });
    await form.locator('[name="date"]').fill('2031-03-03');
    await form.getByLabel('Godziny').fill('10:00-12:00');
    await form.getByLabel('Miejsce').fill(room);
    await form.getByLabel('Powtarzaj co tydzień do').fill('2031-03-17');
    await form.getByRole('button', { name: 'Dodaj' }).click();

    await expect(page.getByText('Dodano 3 terminów.')).toBeVisible();
    await expect(
      page.getByRole('cell', { name: `10:00 - 12:00, ${room}` })
    ).toHaveCount(3);
  });

  test('adds a course with its statute and syllabus', async ({
    page,
    browserName,
  }) => {
    const name = `Przedmiot e2e ${browserName} ${Date.now()}`;
    await page.goto(`${ADMIN_BASE}/student/documents`);
    const form = page.locator('section', { hasText: 'Nowy przedmiot' });
    await form.locator('[name="subjectName_pl"]').fill(name);
    await form.getByLabel('Statut (PDF)').setInputFiles(pdf('statut.pdf'));
    await form.getByLabel('Sylabus (PDF)').setInputFiles(pdf('sylabus.pdf'));
    await form.getByLabel('Kolejność').fill('900');
    await form.getByRole('button', { name: 'Dodaj przedmiot' }).click();
    await expect(page.getByText('Dodano przedmiot.')).toBeVisible();

    await page.goto('/pl/student');
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();
    const href = await row.getByRole('link').first().getAttribute('href');
    expect(href).toMatch(/^\/media\/statut-[0-9a-f]{12}\.pdf$/);
    const file = await page.request.get(href!);
    expect(file.headers()['content-type']).toBe('application/pdf');

    await page.goto(`${ADMIN_BASE}/student/documents`);
    await page.locator('details', { hasText: name }).locator('summary').click();
    page.once('dialog', (d) => d.accept());
    await page
      .locator('details', { hasText: name })
      .getByRole('button', { name: 'Przenieś do kosza' })
      .click();
    await expect(page.locator('details', { hasText: name })).toHaveCount(0);
  });
});
