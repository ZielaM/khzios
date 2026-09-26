'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { EDITABLE_TEXTS, textProblem } from '@/lib/content-overrides';
import { logAudit } from '@/lib/admin/audit';
import { field, type FormState } from '@/lib/admin/form';
import { LANGUAGES } from '@/lib/admin/languages';
import { adminHref } from '@/lib/admin/paths';
import { revalidatePublicSite } from '@/lib/admin/revalidate';
import { requireUser } from '@/lib/admin/session';
import { defaultMessages } from '@/lib/admin/default-messages';

function sectionKeys(namespace: string) {
  const section = EDITABLE_TEXTS.find((s) => s.namespace === namespace);
  if (!section) return null;
  const all = Object.keys(defaultMessages.pl[namespace] ?? {});
  return { section, keys: section.keys ?? all };
}

/**
 * Stores the texts of one page section. A text equal to the default is not
 * stored (so later changes to the defaults still apply).
 */
export async function saveTexts(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  const namespace = field(formData, 'namespace', 50);
  const found = sectionKeys(namespace);
  if (!found) return { error: 'Nieznana sekcja.' };

  const upserts: {
    key: string;
    languageCode: (typeof LANGUAGES)[number]['code'];
    value: string;
  }[] = [];
  const removals: { key: string; languageCode: string }[] = [];
  for (const { code, label } of LANGUAGES) {
    for (const name of found.keys) {
      const key = `${namespace}.${name}`;
      const fallback = String(defaultMessages[code][namespace]?.[name] ?? '');
      const value = String(formData.get(`${name}_${code}`) ?? '')
        .trim()
        .slice(0, 5000);
      if (value === fallback.trim()) {
        removals.push({ key, languageCode: code });
        continue;
      }
      const problem = textProblem(fallback, value);
      if (problem)
        return { error: `${label}, „${fallback.slice(0, 50)}…”: ${problem}` };
      upserts.push({ key, languageCode: code, value });
    }
  }

  await prisma.$transaction([
    ...removals.map((r) =>
      prisma.contentOverride.deleteMany({
        where: { key: r.key, languageCode: r.languageCode as never },
      })
    ),
    ...upserts.map((u) =>
      prisma.contentOverride.upsert({
        where: {
          key_languageCode: { key: u.key, languageCode: u.languageCode },
        },
        create: u,
        update: { value: u.value },
      })
    ),
  ]);
  await logAudit(user, 'update', 'texts', `Teksty: ${found.section.label}`);
  revalidatePublicSite();
  revalidatePath(adminHref(`/texts/${namespace}`));
  return {
    message: upserts.length
      ? `Zapisano (zmienionych tekstów: ${upserts.length}).`
      : 'Zapisano. Wszystkie teksty są domyślne.',
  };
}

export async function restoreDefaultTexts(formData: FormData) {
  const user = await requireUser();
  const namespace = field(formData, 'namespace', 50);
  const found = sectionKeys(namespace);
  if (!found) return;
  await prisma.contentOverride.deleteMany({
    where: { key: { startsWith: `${namespace}.` } },
  });
  await logAudit(
    user,
    'update',
    'texts',
    `Teksty: ${found.section.label} (przywrócono domyślne)`
  );
  revalidatePublicSite();
  revalidatePath(adminHref(`/texts/${namespace}`));
}
