import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ADMIN_BASE, DEV_ADMIN_ACCOUNTS, signIn, totpCode } from './helpers';

const { admin, editor, codeCheck, newcomer } = DEV_ADMIN_ACCOUNTS;

test.describe('Admin panel sign-in', () => {
  test('pages other than sign-in are a plain 404 without a session', async ({
    page,
  }) => {
    for (const path of [
      `${ADMIN_BASE}/account`,
      '/admin-panel',
      '/admin-panel/account',
    ]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
      await expect(page.getByText('Nie znaleziono strony.')).toBeVisible();
      await expect(page.getByText('Panel KHZiOS')).toHaveCount(0);
    }
  });

  test('a wrong password gets a generic message, not a 404', async ({
    page,
    browserName,
  }) => {
    await page.goto(ADMIN_BASE);
    // Same message as for a real account; failures on real accounts would
    // add up towards their sign-in lock across browsers and retries
    await page.getByLabel('Login').fill(`unknown-${browserName}-${Date.now()}`);
    await page.getByLabel('Hasło').fill('not-the-password');
    await page.getByRole('button', { name: 'Zaloguj się' }).click();

    await expect(page.locator('form [role="alert"]')).toHaveText(
      'Nieprawidłowy login lub hasło.'
    );
    await expect(page.getByLabel('Login')).toBeVisible();
  });

  test('signs in with a TOTP code and signs out', async ({ page }) => {
    await signIn(page, admin);
    await expect(page.getByRole('navigation', { name: 'Panel' })).toBeVisible();

    await page.getByRole('button', { name: 'Wyloguj' }).click();
    await expect(
      page.getByRole('button', { name: 'Zaloguj się' })
    ).toBeVisible();
    const response = await page.goto(`${ADMIN_BASE}/account`);
    expect(response?.status()).toBe(404);
  });

  test('rejects a wrong second-factor code', async ({ page }) => {
    await page.goto(ADMIN_BASE);
    await page.getByLabel('Login').fill(codeCheck.login);
    await page.getByLabel('Hasło').fill(codeCheck.password);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await page.getByLabel('Kod z aplikacji uwierzytelniającej').fill('000000');
    await page.getByRole('button', { name: 'Potwierdź' }).click();

    await expect(page.locator('form [role="alert"]')).toContainText(
      'Nieprawidłowy kod'
    );
    // Still limited to the second step
    const response = await page.goto(`${ADMIN_BASE}/account`);
    expect(response?.status()).toBe(404);
  });

  test('locks a login after repeated failures', async ({
    page,
    browserName,
  }) => {
    // A login of its own, so the lock does not affect the other tests
    const login = `nobody-${browserName}-${Date.now()}`;
    await page.goto(ADMIN_BASE);
    // The message is the same every time, so wait for each answer instead
    const attempt = async () => {
      await page.getByLabel('Login').fill(login);
      await page.getByLabel('Hasło').fill('wrong-password-123');
      await Promise.all([
        page.waitForResponse((r) => r.request().method() === 'POST'),
        page.getByRole('button', { name: 'Zaloguj się' }).click(),
      ]);
      // React clears the form after the action; typing earlier gets erased
      await expect(page.getByLabel('Login')).toHaveValue('');
    };
    for (let i = 0; i < 5; i++) await attempt();
    await expect(page.locator('form [role="alert"]')).toHaveText(
      'Nieprawidłowy login lub hasło.'
    );
    await attempt();
    await expect(page.locator('form [role="alert"]')).toContainText(
      'Zbyt wiele nieudanych prób'
    );
  });

  test('an editor sees their role on the account page', async ({ page }) => {
    await signIn(page, editor);
    await page.goto(`${ADMIN_BASE}/account`);
    await expect(page.getByText('Redaktor', { exact: true })).toBeVisible();
  });

  test('the first sign-in sets up two-factor authentication', async ({
    page,
    browserName,
  }) => {
    // Enrolment changes the account, so it runs once per seeded database
    test.skip(browserName !== 'chromium');

    await page.goto(ADMIN_BASE);
    await page.getByLabel('Login').fill(newcomer.login);
    await page.getByLabel('Hasło').fill(newcomer.password);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();

    await expect(
      page.getByRole('heading', { name: 'Włącz logowanie dwuskładnikowe' })
    ).toBeVisible();
    await expect(page.getByRole('img', { name: /Kod QR/ })).toBeVisible();
    const secret = (await page.locator('code').first().textContent())!.trim();

    await page.getByLabel('Kod z aplikacji').fill(totpCode(secret));
    await page
      .getByRole('button', { name: 'Włącz logowanie dwuskładnikowe' })
      .click();
    await expect(
      page
        .getByRole('listitem')
        .filter({ hasText: /^[0-9a-f]{5}-[0-9a-f]{5}$/ })
    ).toHaveCount(10);

    await page.getByRole('link', { name: /przejdź do panelu/ }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Pulpit' })
    ).toBeVisible();
  });
});

test.describe('Admin panel accessibility', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test.skip(({ browserName }) => browserName !== 'chromium');

  test('sign-in and dashboard pass an axe scan', async ({ page }) => {
    const scan = async () =>
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
      ).violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`
      );

    await page.goto(ADMIN_BASE);
    expect(await scan()).toEqual([]);
    await signIn(page, DEV_ADMIN_ACCOUNTS.admin);
    expect(await scan()).toEqual([]);

    for (const path of [
      '/news',
      '/news/new',
      '/tags',
      '/student/announcements',
      '/student/consultations',
      '/student/documents',
      '/employees',
      '/employees/new',
      '/teams',
      '/teams/new',
      '/publications',
      '/office',
      '/images',
      '/account',
    ]) {
      await page.goto(`${ADMIN_BASE}${path}`);
      expect(await scan(), path).toEqual([]);
    }
  });
});
