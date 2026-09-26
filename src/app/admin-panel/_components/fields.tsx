import type { InputHTMLAttributes, ReactNode } from 'react';
import { LANGUAGES } from '@/lib/admin/languages';
import LanguageTabs from './LanguageTabs';
import style from './forms.module.scss';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  multiline?: boolean;
};

/** Labelled input (or textarea), with an optional hint below. */
export function Field({ label, hint, multiline, ...input }: FieldProps) {
  return (
    <label className={style.field}>
      <span>
        {label}
        {input.required && ' *'}
      </span>
      {multiline ? (
        <textarea
          name={input.name}
          defaultValue={input.defaultValue as string}
          maxLength={input.maxLength}
          required={input.required}
          rows={4}
        />
      ) : (
        <input {...input} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export interface TranslatedField {
  name: string;
  label: string;
  maxLength?: number;
  multiline?: boolean;
  /** Required in Polish only; other languages are optional */
  required?: boolean;
}

/**
 * Language tabs with the translated fields of a record, named
 * "<field>_<lang>" as read by lib/admin/form.ts translations().
 */
export function TranslatedFields({
  fields,
  values = {},
}: {
  fields: TranslatedField[];
  /** values[lang][field] */
  values?: Partial<Record<string, Partial<Record<string, string | null>>>>;
}) {
  return (
    <LanguageTabs
      panels={LANGUAGES.map(({ code, label }) => ({
        code,
        label,
        required: code === 'pl' && fields.some((f) => f.required),
        filled: fields.some((f) => values[code]?.[f.name]),
        content: fields.map((f) => (
          <Field
            key={f.name}
            label={f.label}
            name={`${f.name}_${code}`}
            defaultValue={values[code]?.[f.name] ?? ''}
            maxLength={f.maxLength}
            multiline={f.multiline}
            required={code === 'pl' && f.required}
          />
        )),
      }))}
    />
  );
}

/** values[lang][field] from a translations array. */
export function valuesByLanguage<T extends { languageCode: string }>(
  items: T[]
) {
  return Object.fromEntries(
    items.map((t) => [t.languageCode, t as Record<string, string | null>])
  );
}
