import { expect, type Page } from '@playwright/test';
import { Secret, TOTP } from 'otpauth';
import { DEV_ADMIN_ACCOUNTS } from '../../prisma/dev-admin-accounts';

export { DEV_ADMIN_ACCOUNTS };

/** Panel address used by the e2e server (see the CI workflow). */
export const ADMIN_BASE = `/${process.env.ADMIN_PATH ?? 'zaplecze-e2e-test'}`;

export function totpCode(secret: string) {
  return new TOTP({ secret: Secret.fromBase32(secret) }).generate();
}

type Account = (typeof DEV_ADMIN_ACCOUNTS)['admin' | 'editor'];

/** Signs in with password and TOTP and waits for the dashboard. */
export async function signIn(page: Page, account: Account) {
  await page.goto(ADMIN_BASE);
  await page.getByLabel('Login').fill(account.login);
  await page.getByLabel('Hasło').fill(account.password);
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page
    .getByLabel('Kod z aplikacji uwierzytelniającej')
    .fill(totpCode(account.totpSecret));
  await page.getByRole('button', { name: 'Potwierdź' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Pulpit' })
  ).toBeVisible();
}
