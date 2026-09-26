'use client';

import { useActionState } from 'react';
import { changePassword, type FormState } from '../_actions/auth';
import { PASSWORD_MIN_LENGTH } from '@/lib/admin/password-rules';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import style from './forms.module.scss';

export default function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(
    changePassword,
    {}
  );
  return (
    <form action={action} className={style.form}>
      <FormMessage error={state.error} message={state.message} />
      <label className={style.field}>
        <span>Obecne hasło</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <label className={style.field}>
        <span>Nowe hasło</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
        />
        <small>
          Co najmniej {PASSWORD_MIN_LENGTH} znaków. Najlepiej kilka słów, które
          nie tworzą znanego zdania.
        </small>
      </label>
      <label className={style.field}>
        <span>Powtórz nowe hasło</span>
        <input
          name="repeatPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </label>
      <SubmitButton>Zmień hasło</SubmitButton>
    </form>
  );
}
