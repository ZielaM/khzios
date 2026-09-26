'use client';

import { useActionState } from 'react';
import { saveTag } from '../_actions/tags';
import type { FormState } from '@/lib/admin/form';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import style from './forms.module.scss';

export default function TagForm({
  id,
  names,
}: {
  id?: string;
  names: { code: string; label: string; name: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveTag, {});
  return (
    <form action={action} className={style.form}>
      {id && <input type="hidden" name="id" value={id} />}
      <FormMessage error={state.error} message={state.message} />
      <div className={style.row}>
        {names.map((n) => (
          <label key={n.code} className={style.field}>
            <span>
              {n.label}
              {n.code === 'pl' && ' *'}
            </span>
            <input
              name={`name_${n.code}`}
              defaultValue={n.name}
              maxLength={60}
              required={n.code === 'pl'}
            />
          </label>
        ))}
      </div>
      <SubmitButton>{id ? 'Zapisz' : 'Dodaj tag'}</SubmitButton>
    </form>
  );
}
