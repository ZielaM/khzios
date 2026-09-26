'use client';

import { useActionState } from 'react';
import { verifySecondFactor, type FormState } from '../_actions/auth';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import style from './forms.module.scss';

export default function SecondFactorForm() {
  const [state, action] = useActionState<FormState, FormData>(
    verifySecondFactor,
    {}
  );
  return (
    <form action={action} className={style.form}>
      <FormMessage error={state.error} />
      <label className={style.field}>
        <span>Kod z aplikacji uwierzytelniającej</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          autoFocus
        />
        <small>
          Nie masz telefonu? Wpisz jeden z kodów zapasowych (np. a1b2c-3d4e5).
        </small>
      </label>
      <SubmitButton pendingLabel="Sprawdzanie…">Potwierdź</SubmitButton>
    </form>
  );
}
