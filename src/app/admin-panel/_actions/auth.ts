'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/client-ip';
import {
  getDummyHash,
  hashPassword,
  passwordProblem,
  verifyPassword,
} from '@/lib/admin/password';
import { adminHref } from '@/lib/admin/paths';
import { isSignInLocked, recordSignInAttempt } from '@/lib/admin/rate-limit';
import {
  createSession,
  destroySession,
  destroyUserSessions,
  getSession,
  markSessionMfaPassed,
} from '@/lib/admin/session';
import {
  findRecoveryCode,
  generateRecoveryCodes,
  verifyTotp,
} from '@/lib/admin/totp';

export interface FormState {
  error?: string;
  message?: string;
  recoveryCodes?: string[];
}

// The same message whether the login exists or not
const INVALID = 'Nieprawidłowy login lub hasło.';
const LOCKED =
  'Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za kilkanaście minut.';

const text = (formData: FormData, name: string) =>
  String(formData.get(name) ?? '');

export async function signIn(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const login = text(formData, 'login').trim().toLowerCase().slice(0, 100);
  const password = text(formData, 'password');
  if (!login || !password) return { error: INVALID };

  const ip = getClientIp(await headers());
  if (await isSignInLocked(login, ip)) {
    await recordSignInAttempt(login, ip, false, 'locked');
    return { error: LOCKED };
  }

  const user = await prisma.adminUser.findUnique({ where: { login } });
  // Without an account the password is still checked against a dummy hash,
  // so the response time does not tell which logins exist
  const passwordOk = await verifyPassword(
    user?.passwordHash ?? (await getDummyHash()),
    password
  );

  if (!user || !passwordOk || user.disabled) {
    await recordSignInAttempt(
      login,
      ip,
      false,
      user?.disabled && passwordOk ? 'disabled' : 'password'
    );
    return { error: INVALID };
  }

  // Password accepted; the session stays limited until the second factor
  await createSession(user.id, false);
  redirect(adminHref());
}

/** Second step: a code from the authenticator app or a recovery code. */
export async function verifySecondFactor(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session || session.mfaPassed || !session.user.totpSecret) {
    redirect(adminHref());
  }
  const { user } = session;
  const ip = getClientIp(await headers());

  if (await isSignInLocked(user.login, ip)) {
    await destroySession();
    return { error: LOCKED };
  }

  const code = text(formData, 'code').trim();
  let ok = verifyTotp(user.totpSecret!, user.login, code);
  let usedRecoveryCode = false;

  if (!ok) {
    const index = findRecoveryCode(user.recoveryCodes, code);
    if (index >= 0) {
      ok = true;
      usedRecoveryCode = true;
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          recoveryCodes: user.recoveryCodes.filter((_, i) => i !== index),
        },
      });
    }
  }

  if (!ok) {
    await recordSignInAttempt(user.login, ip, false, 'totp');
    return {
      error: 'Nieprawidłowy kod. Sprawdź czas w telefonie i spróbuj ponownie.',
    };
  }

  await completeSignIn(user.id, user.login, ip);
  if (usedRecoveryCode) {
    await logAudit(user, 'security', 'account', 'Logowanie kodem zapasowym');
  }
  redirect(adminHref());
}

/** First sign-in: confirms the authenticator app and shows recovery codes. */
export async function confirmEnrollment(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  const secret = session?.totpPendingSecret;
  if (!session || session.mfaPassed || session.user.totpSecret || !secret) {
    redirect(adminHref());
  }
  const { user } = session;

  if (!verifyTotp(secret, user.login, text(formData, 'code'))) {
    return {
      error:
        'Kod się nie zgadza. Upewnij się, że dodałeś konto w aplikacji i wpisz aktualny kod.',
    };
  }

  const { codes, hashes } = generateRecoveryCodes();
  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: user.id },
      data: { totpSecret: secret, recoveryCodes: hashes },
    }),
    prisma.adminSession.update({
      where: { tokenHash: session.tokenHash },
      data: { totpPendingSecret: null },
    }),
  ]);
  await completeSignIn(user.id, user.login, getClientIp(await headers()));
  await logAudit(
    user,
    'security',
    'account',
    'Włączenie logowania dwuskładnikowego'
  );
  // Shown once; the page then offers to continue to the panel
  return { recoveryCodes: codes };
}

async function completeSignIn(userId: string, login: string, ip: string) {
  await markSessionMfaPassed();
  await prisma.adminUser.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
  await recordSignInAttempt(login, ip, true);
}

export async function changePassword(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session?.mfaPassed) redirect(adminHref());
  const { user } = session;

  const current = text(formData, 'currentPassword');
  const next = text(formData, 'newPassword');
  const repeated = text(formData, 'repeatPassword');

  if (!(await verifyPassword(user.passwordHash, current))) {
    return { error: 'Obecne hasło jest nieprawidłowe.' };
  }
  const problem = passwordProblem(next);
  if (problem) return { error: problem };
  if (next !== repeated) return { error: 'Nowe hasła nie są takie same.' };
  if (next === current)
    return { error: 'Nowe hasło musi się różnić od obecnego.' };

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false },
  });
  // Other browsers signed in with the old password are signed out
  await destroyUserSessions(user.id, true);
  await logAudit(user, 'security', 'account', 'Zmiana hasła');
  // A required change (temporary password) leads on to the panel
  if (user.mustChangePassword) redirect(adminHref());
  return { message: 'Hasło zostało zmienione.' };
}

export async function signOut() {
  await destroySession();
  redirect(adminHref());
}

/** New recovery codes after checking the password; the old ones stop working. */
export async function regenerateRecoveryCodes(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await getSession();
  if (!session?.mfaPassed) redirect(adminHref());
  const { user } = session;
  if (!(await verifyPassword(user.passwordHash, text(formData, 'password')))) {
    return { error: 'Nieprawidłowe hasło.' };
  }
  const { codes, hashes } = generateRecoveryCodes();
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { recoveryCodes: hashes },
  });
  await logAudit(user, 'security', 'account', 'Nowe kody zapasowe');
  return { recoveryCodes: codes };
}

/** Signs out every other browser (e.g. after using a shared computer). */
export async function signOutEverywhereElse(): Promise<void> {
  const session = await getSession();
  if (!session?.mfaPassed) redirect(adminHref());
  await destroyUserSessions(session.user.id, true);
  await logAudit(
    session.user,
    'security',
    'account',
    'Wylogowanie z pozostałych urządzeń'
  );
  redirect(adminHref('/account?signedOut=1'));
}
