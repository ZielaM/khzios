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

const WEEKDAY_NAMES = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
];

/** Seven inputs hours_1 … hours_7; empty means closed / no hours. */
export function WeeklyHoursFields({
  legend,
  hours = [],
}: {
  legend: string;
  /** Current hours by day (index 0 = Monday) */
  hours?: string[];
}) {
  return (
    <fieldset className={style.fieldset}>
      <legend>{legend}</legend>
      {WEEKDAY_NAMES.map((day, i) => (
        <Field
          key={day}
          label={day}
          name={`hours_${i + 1}`}
          defaultValue={hours[i] ?? ''}
          placeholder="np. 08:00 - 14:00"
          maxLength={60}
        />
      ))}
      <small>Puste pole oznacza, że tego dnia nie ma godzin.</small>
    </fieldset>
  );
}

/** Polish hours per weekday from DB rows with displayOrder 1–7. */
export function hoursByDay(
  rows: {
    displayOrder: number;
    translations: { languageCode: string; hours: string }[];
  }[]
) {
  return Array.from({ length: 7 }, (_, i) => {
    const row = rows.find((r) => r.displayOrder === i + 1);
    return row?.translations.find((t) => t.languageCode === 'pl')?.hours ?? '';
  });
}
