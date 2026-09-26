'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { parseDateInput } from '@/lib/dates';
import { SETTING_DEFAULTS, type SettingKey } from '@/lib/settings';
import { logAudit } from '@/lib/admin/audit';
import { field, type FormState } from '@/lib/admin/form';
import { adminHref } from '@/lib/admin/paths';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LABELS: Record<SettingKey, string> = {
  contact: 'Dane kontaktowe',
  accessibility: 'Daty deklaracji dostępności',
  privacy: 'Dane polityki prywatności',
};

function problem(
  key: SettingKey,
  values: Record<string, string>
): string | null {
  if (key === 'contact') {
    if (!EMAIL.test(values.email)) return 'Podaj prawidłowy adres e-mail.';
    if (!values.phone) return 'Podaj numer telefonu.';
  }
  if (key === 'accessibility') {
    for (const [name, value] of Object.entries(values)) {
      if (value && !parseDateInput(value)) return 'Nieprawidłowa data.';
      if (!value && name !== 'published')
        return 'Uzupełnij wszystkie daty (poza datą publikacji, jeśli strona jeszcze nie działa).';
    }
  }
  if (key === 'privacy') {
    if (!parseDateInput(values.lastUpdated))
      return 'Nieprawidłowa data aktualizacji.';
    if (!values.controllerAddress) return 'Podaj adres administratora danych.';
    if (values.dpoEmail && !EMAIL.test(values.dpoEmail))
      return 'Nieprawidłowy adres e-mail inspektora.';
  }
  return null;
}

/** Saves one group of settings; values equal to the defaults are not stored. */
export async function saveSettings(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser('ADMIN');
  const key = field(formData, 'group', 20) as SettingKey;
  if (!(key in SETTING_DEFAULTS)) return { error: 'Nieznana grupa ustawień.' };

  const defaults = SETTING_DEFAULTS[key] as Record<string, string>;
  const values = Object.fromEntries(
    Object.keys(defaults).map((name) => [name, field(formData, name, 300)])
  );
  const error = problem(key, values);
  if (error) return { error };

  const changed = Object.fromEntries(
    Object.entries(values).filter(([name, value]) => value !== defaults[name])
  );
  if (Object.keys(changed).length === 0) {
    await prisma.siteSetting.deleteMany({ where: { key } });
  } else {
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: changed as Prisma.InputJsonValue },
      update: { value: changed as Prisma.InputJsonValue },
    });
  }
  await logAudit(user, 'update', 'settings', LABELS[key]);
  revalidatePublicSite();
  revalidatePath(adminHref('/settings'));
  return { message: 'Zapisano.' };
}
