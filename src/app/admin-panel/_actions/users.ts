'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { AdminRole } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/admin/audit';
import { field, type FormState } from '@/lib/admin/form';
import { hashPassword } from '@/lib/admin/password';
import { adminHref } from '@/lib/admin/paths';
import { destroyUserSessions, requireUser } from '@/lib/admin/session';

export interface UserFormState extends FormState {
  /** A temporary password, shown once */
  password?: string;
}

const LOGIN = /^[a-z0-9._-]{3,50}$/;

// Four groups of five letters and digits: easy to dictate, ~100 bits
function temporaryPassword() {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(20);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return chars.match(/.{5}/g)!.join('-');
}

function refresh() {
  revalidatePath(adminHref('/users'));
}

async function activeAdminsExcept(id: string) {
  return prisma.adminUser.count({
    where: { role: 'ADMIN', disabled: false, NOT: { id } },
  });
}

export async function createUser(
  _: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await requireUser('ADMIN');
  const login = field(formData, 'login', 50).toLowerCase();
  const name = field(formData, 'name', 100);
  const role: AdminRole =
    field(formData, 'role') === 'ADMIN' ? 'ADMIN' : 'EDITOR';
  if (!LOGIN.test(login))
    return {
      error:
        'Login: 3–50 znaków (małe litery, cyfry, kropka, myślnik, podkreślenie).',
    };
  if (!name) return { error: 'Podaj imię i nazwisko.' };
  if (await prisma.adminUser.findUnique({ where: { login } }))
    return { error: `Konto „${login}” już istnieje.` };

  const password = temporaryPassword();
  await prisma.adminUser.create({
    data: {
      login,
      name,
      role,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    },
  });
  await logAudit(
    admin,
    'security',
    'user',
    `Utworzenie konta ${login} (${role === 'ADMIN' ? 'administrator' : 'redaktor'})`
  );
  refresh();
  return {
    message: `Utworzono konto „${login}”. Przekaż hasło tymczasowe osobiście; przy pierwszym logowaniu trzeba je zmienić i włączyć logowanie dwuskładnikowe.`,
    password,
  };
}

export async function updateUser(
  _: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await requireUser('ADMIN');
  const id = field(formData, 'id', 100);
  const name = field(formData, 'name', 100);
  const role: AdminRole =
    field(formData, 'role') === 'ADMIN' ? 'ADMIN' : 'EDITOR';
  const disabled = formData.get('disabled') === 'on';
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return { error: 'To konto już nie istnieje.' };
  if (!name) return { error: 'Podaj imię i nazwisko.' };

  if (id === admin.id && (disabled || role !== 'ADMIN')) {
    return {
      error:
        'Nie możesz zablokować swojego konta ani odebrać sobie roli administratora.',
    };
  }
  const losesAdmin =
    user.role === 'ADMIN' && !user.disabled && (role !== 'ADMIN' || disabled);
  if (losesAdmin && (await activeAdminsExcept(id)) === 0) {
    return { error: 'Musi zostać co najmniej jeden aktywny administrator.' };
  }

  await prisma.adminUser.update({
    where: { id },
    data: { name, role, disabled },
  });
  if (disabled) await destroyUserSessions(id);
  await logAudit(
    admin,
    'security',
    'user',
    `Konto ${user.login}: ${role === 'ADMIN' ? 'administrator' : 'redaktor'}${disabled ? ', zablokowane' : ''}`
  );
  refresh();
  return { message: 'Zapisano.' };
}

export async function resetUserPassword(
  _: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await requireUser('ADMIN');
  const user = await prisma.adminUser.findUnique({
    where: { id: field(formData, 'id', 100) },
  });
  if (!user) return { error: 'To konto już nie istnieje.' };
  const password = temporaryPassword();
  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    },
  });
  await destroyUserSessions(user.id);
  await logAudit(
    admin,
    'security',
    'user',
    `Nowe hasło tymczasowe dla ${user.login}`
  );
  refresh();
  return {
    message: `Nowe hasło tymczasowe dla „${user.login}”. Konto zostało wylogowane.`,
    password,
  };
}

export async function resetUserTwoFactor(
  _: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const admin = await requireUser('ADMIN');
  const user = await prisma.adminUser.findUnique({
    where: { id: field(formData, 'id', 100) },
  });
  if (!user) return { error: 'To konto już nie istnieje.' };
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { totpSecret: null, recoveryCodes: [] },
  });
  await destroyUserSessions(user.id);
  await logAudit(
    admin,
    'security',
    'user',
    `Reset logowania dwuskładnikowego dla ${user.login}`
  );
  refresh();
  return {
    message: `„${user.login}” przy następnym logowaniu ustawi aplikację uwierzytelniającą od nowa.`,
  };
}
