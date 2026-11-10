import type { LanguageCode } from '@/generated/prisma/client';
import { LANGUAGES } from './languages';

/** Trimmed text field, cut to a maximum length. */
export function field(formData: FormData, name: string, max = 10_000) {
  return String(formData.get(name) ?? '')
    .trim()
    .slice(0, max);
}

/**
 * A time of day as zero-padded "HH:MM" (so times sort as strings), or null.
 * Accepts "8:00" and "8.00", as the source documents write it.
 */
export function timeField(formData: FormData, name: string) {
  const match = field(formData, name, 10).match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return null;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

export function checkbox(formData: FormData, name: string) {
  return formData.get(name) === 'on';
}

/**
 * Per-language values of translated fields named "<field>_<lang>", e.g.
 * title_pl. Languages where every field is empty are left out.
 */
export function translations<F extends string>(
  formData: FormData,
  fields: readonly F[],
  max: Partial<Record<F, number>> = {}
) {
  const result: { languageCode: LanguageCode; values: Record<F, string> }[] =
    [];
  for (const { code } of LANGUAGES) {
    const values = Object.fromEntries(
      fields.map((f) => [f, field(formData, `${f}_${code}`, max[f] ?? 10_000)])
    ) as Record<F, string>;
    if (Object.values(values).some(Boolean)) {
      result.push({ languageCode: code, values });
    }
  }
  return result;
}

export interface FormState {
  error?: string;
  message?: string;
  /** A temporary password, shown once after it is generated */
  password?: string;
  /** New recovery codes, shown once */
  recoveryCodes?: string[];
}
