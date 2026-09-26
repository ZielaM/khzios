import type { LanguageCode } from '@/generated/prisma/client';
import { LANGUAGES } from './languages';

/** Trimmed text field, cut to a maximum length. */
export function field(formData: FormData, name: string, max = 10_000) {
  return String(formData.get(name) ?? '')
    .trim()
    .slice(0, max);
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
}
