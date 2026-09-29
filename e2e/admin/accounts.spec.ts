import { test, expect } from '@playwright/test';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn, totpCode } from './helpers';

const { admin, editor } = DEV_ADMIN_ACCOUNTS;
const RECOVERY_CODE = /^[0-9a-f]{5}-[0-9a-f]{5}$/;

test.describe('Admin panel: accounts, trash and logs', () => {
  test('a new account sets up 2FA and its own password, then gets disabled', async ({
    page,
    browser,
    browserName,
  }) => {
    // Creates accounts, so it runs once per seeded database
    test.skip(browserName !== 'chromium');
    const login = `konto-e2e-${Date.now()}`;

    await signIn(page, admin);
    await page.goto(`${ADMIN_BASE}/users`);
    const form = page.getByRole('region', { name: 'Nowe konto' });
    await form.getByLabel('Login').fill(login);
    await form.getByLabel('Imię i nazwisko').fill('Konto Testowe');
    await form.getByRole('button', { name: 'Utwórz konto' }).click();
    await expect(form.getByRole('status')).toContainText(
      `Utworzono konto „${login}”`
    );
    const temporary = (await form.locator('code').textContent())!.trim();

    // The new person signs in on their own computer
    const context = await browser.newContext();
    const newcomer = await context.newPage();
    await newcomer.goto(ADMIN_BASE);
    await newcomer.getByLabel('Login').fill(login);
    await newcomer.getByLabel('Hasło').fill(temporary);
    await newcomer.getByRole('button', { name: 'Zaloguj się' }).click();

    const secret = (await newcomer.locator('code').first().textContent())!;
    await newcomer.getByLabel('Kod z aplikacji').fill(totpCode(secret.trim()));
    await newcomer
      .getByRole('button', { name: 'Włącz logowanie dwuskładnikowe' })
      .click();
    await newcomer.getByRole('link', { name: /przejdź do panelu/ }).click();

    await expect(
      newcomer.getByRole('heading', { name: 'Ustaw nowe hasło' })
    ).toBeVisible();
    const password = 'nowe hasło konta testowego';
    await newcomer.locator('[name="currentPassword"]').fill(temporary);
    await newcomer.locator('[name="newPassword"]').fill(password);
    await newcomer.locator('[name="repeatPassword"]').fill(password);
    await newcomer.getByRole('button', { name: 'Zmień hasło' }).click();
    await expect(
      newcomer.getByRole('heading', { level: 1, name: 'Pulpit' })
    ).toBeVisible();
    // Editors do not manage accounts
    await expect(
      newcomer.getByRole('link', { name: 'Użytkownicy' })
    ).toHaveCount(0);

    // Fresh recovery codes need the password
    await newcomer.goto(`${ADMIN_BASE}/account`);
    const codes = newcomer.getByRole('region', { name: 'Nowe kody zapasowe' });
    await codes.getByLabel('Obecne hasło').fill(password);
    await codes.getByRole('button', { name: 'Wygeneruj nowe kody' }).click();
    await expect(
      codes.getByRole('listitem').filter({ hasText: RECOVERY_CODE })
    ).toHaveCount(10);

    // Disabling the account signs it out at once
    await page.reload();
    const entry = page.locator('details', { hasText: `(${login})` });
    await entry.locator('summary').click();
    await entry.getByLabel(/Zablokowane/).check();
    await entry.getByRole('button', { name: 'Zapisz' }).click();
    await expect(entry.getByText('Zapisano.')).toBeVisible();

    const response = await newcomer.goto(`${ADMIN_BASE}/account`);
    expect(response?.status()).toBe(404);
    await context.close();
  });

  test('an admin cannot disable their own account', async ({ page }) => {
    await signIn(page, admin);
    await page.goto(`${ADMIN_BASE}/users`);
    const entry = page.locator('details', { hasText: 'to Ty' });
    await entry.locator('summary').click();
    await entry.getByLabel(/Zablokowane/).check();
    await entry.getByRole('button', { name: 'Zapisz' }).click();
    await expect(entry.locator('form [role="alert"]')).toBeVisible();
  });

  test('restores an announcement from the trash', async ({
    page,
    browserName,
  }) => {
    const title = `Kosz e2e ${browserName} ${Date.now()}`;
    await signIn(page, editor);
    await page.goto(`${ADMIN_BASE}/student/announcements`);
    const form = page.locator('section', { hasText: 'Nowe ogłoszenie' });
    await form.locator('[name="title_pl"]').fill(title);
    await form.locator('[name="content_pl"]').fill('Do przywrócenia.');
    await form.getByRole('button', { name: 'Dodaj ogłoszenie' }).click();
    await expect(page.getByText('Dodano ogłoszenie.')).toBeVisible();

    const entry = page.locator('details', { hasText: title });
    await entry.locator('summary').click();
    page.once('dialog', (d) => d.accept());
    await entry.getByRole('button', { name: 'Przenieś do kosza' }).click();
    await expect(entry).toHaveCount(0);

    await page.goto(`${ADMIN_BASE}/trash`);
    const item = page.getByRole('region', { name: `Ogłoszenie „${title}”` });
    // Only administrators delete for good
    await expect(
      item.getByRole('button', { name: 'Usuń na zawsze' })
    ).toHaveCount(0);
    await item.getByRole('button', { name: 'Przywróć' }).click();
    await expect(page.getByRole('status')).toContainText(
      'Przywrócono (ogłoszenie)'
    );

    const schedule = await (
      await page.request.get('/api/student-schedule')
    ).text();
    expect(schedule).toContain(title);
    await page.goto(`${ADMIN_BASE}/student/announcements`);
    await expect(page.locator('details', { hasText: title })).toHaveCount(1);
  });

  test('editors cannot open the log', async ({ page }) => {
    await signIn(page, editor);
    await expect(page.getByRole('link', { name: 'Dziennik' })).toHaveCount(0);
    expect((await page.goto(`${ADMIN_BASE}/logs`))?.status()).toBe(404);
  });

  test('the log lists sign-ins and content changes', async ({ page }) => {
    await signIn(page, admin);
    await page.goto(`${ADMIN_BASE}/logs?tab=logins`);
    const cell = (name: string) =>
      page.getByRole('cell', { name, exact: true });
    await expect(
      page
        .getByRole('row')
        .filter({ has: cell(admin.login) })
        .filter({ has: cell('udane') })
        .first()
    ).toBeVisible();

    await page.getByRole('link', { name: 'Zmiany treści' }).click();
    await expect(
      page.getByRole('link', { name: 'Zmiany treści' })
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('columnheader', { name: 'Kto' })).toBeVisible();
  });

  test('recovery codes work once; other devices can be signed out; admins reset access', async ({
    page,
    browser,
    browserName,
  }) => {
    // Creates accounts, so it runs once per seeded database
    test.skip(browserName !== 'chromium');
    const login = `odzysk-e2e-${Date.now()}`;
    const password = 'haslo konta odzyskiwania';

    await signIn(page, admin);
    await page.goto(`${ADMIN_BASE}/users`);
    const form = page.getByRole('region', { name: 'Nowe konto' });
    await form.getByLabel('Login').fill(login);
    await form.getByLabel('Imię i nazwisko').fill('Konto Odzyskiwania');
    await form.getByRole('button', { name: 'Utwórz konto' }).click();
    const temporary = (await form.locator('code').textContent())!.trim();

    const device = async () => (await browser.newContext()).newPage();
    const passwordStep = async (p: typeof page, pass: string) => {
      await p.goto(ADMIN_BASE);
      await p.getByLabel('Login').fill(login);
      await p.getByLabel('Hasło').fill(pass);
      await p.getByRole('button', { name: 'Zaloguj się' }).click();
    };
    const secondStep = async (p: typeof page, code: string) => {
      await p.getByLabel('Kod z aplikacji uwierzytelniającej').fill(code);
      await p.getByRole('button', { name: 'Potwierdź' }).click();
    };
    const dashboard = (p: typeof page) =>
      expect(
        p.getByRole('heading', { level: 1, name: 'Pulpit' })
      ).toBeVisible();

    // First sign-in: two-factor setup, recovery codes, own password
    const first = await device();
    await passwordStep(first, temporary);
    const secret = (await first.locator('code').first().textContent())!.trim();
    await first.getByLabel('Kod z aplikacji').fill(totpCode(secret));
    await first
      .getByRole('button', { name: 'Włącz logowanie dwuskładnikowe' })
      .click();
    const codes = first
      .getByRole('listitem')
      .filter({ hasText: RECOVERY_CODE });
    await expect(codes).toHaveCount(10);
    const recovery = (await codes.first().textContent())!.trim();
    await first.getByRole('link', { name: /przejdź do panelu/ }).click();
    await first.locator('[name="currentPassword"]').fill(temporary);
    await first.locator('[name="newPassword"]').fill(password);
    await first.locator('[name="repeatPassword"]').fill(password);
    await first.getByRole('button', { name: 'Zmień hasło' }).click();
    await dashboard(first);

    // A recovery code instead of the phone, accepted once only
    const second = await device();
    await passwordStep(second, password);
    await secondStep(second, recovery);
    await dashboard(second);
    const third = await device();
    await passwordStep(third, password);
    await secondStep(third, recovery);
    await expect(third.locator('form [role="alert"]')).toContainText(
      'Nieprawidłowy kod'
    );

    // Signing out the other devices from one of them
    await second.goto(`${ADMIN_BASE}/account`);
    second.once('dialog', (d) => d.accept());
    await second
      .getByRole('button', {
        name: 'Wyloguj ze wszystkich pozostałych urządzeń',
      })
      .click();
    await expect(second.getByRole('status')).toContainText(
      'Wylogowano ze wszystkich pozostałych urządzeń.'
    );
    expect((await first.goto(`${ADMIN_BASE}/account`))?.status()).toBe(404);
    expect((await second.goto(`${ADMIN_BASE}/account`))?.status()).toBe(200);

    // An administrator gives a new temporary password and resets 2FA
    await page.reload();
    const entry = page.locator('details', { hasText: `(${login})` });
    await entry.locator('summary').click();
    await entry
      .getByRole('button', { name: 'Nadaj nowe hasło tymczasowe' })
      .click();
    const newTemporary = (await entry.locator('code').textContent())!.trim();
    await entry
      .getByRole('button', { name: 'Zresetuj logowanie dwuskładnikowe' })
      .click();
    await expect(
      entry.getByText(/ustawi aplikację uwierzytelniającą od nowa/)
    ).toBeVisible();
    // Both reset the sessions
    expect((await second.goto(`${ADMIN_BASE}/account`))?.status()).toBe(404);

    const fourth = await device();
    await passwordStep(fourth, newTemporary);
    await expect(
      fourth.getByRole('heading', { name: 'Włącz logowanie dwuskładnikowe' })
    ).toBeVisible();
  });

  test('administrators delete trashed items for good', async ({
    page,
    browserName,
  }) => {
    const title = `Na zawsze e2e ${browserName} ${Date.now()}`;
    await signIn(page, admin);
    await page.goto(`${ADMIN_BASE}/student/announcements`);
    const form = page.locator('section', { hasText: 'Nowe ogłoszenie' });
    await form.locator('[name="title_pl"]').fill(title);
    await form.locator('[name="content_pl"]').fill('Do usunięcia.');
    await form.getByRole('button', { name: 'Dodaj ogłoszenie' }).click();
    const entry = page.locator('details', { hasText: title });
    await entry.locator('summary').click();
    page.once('dialog', (d) => d.accept());
    await entry.getByRole('button', { name: 'Przenieś do kosza' }).click();
    await expect(entry).toHaveCount(0);

    await page.goto(`${ADMIN_BASE}/trash`);
    const item = page.getByRole('region', { name: `Ogłoszenie „${title}”` });
    page.once('dialog', (d) => d.accept());
    await item.getByRole('button', { name: 'Usuń na zawsze' }).click();
    await expect(item).toHaveCount(0);
    await page.goto(`${ADMIN_BASE}/logs`);
    await expect(
      page.getByRole('cell', {
        name: `Ogłoszenie „${title}” (usunięte na zawsze)`,
      })
    ).toBeVisible();
  });
});
