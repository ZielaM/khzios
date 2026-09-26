'use client';

import { useActionState } from 'react';
import { signIn, type FormState } from '../_actions/auth';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import style from './forms.module.scss';

export default function SignInForm() {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form action={action} className={style.form}>
      <FormMessage error={state.error} />
      <label className={style.field}>
        <span>Login</span>
        <input
          name="login"
          autoComplete="username"
          required
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>
      <label className={style.field}>
        <span>Hasło</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <SubmitButton pendingLabel="Logowanie…">Zaloguj się</SubmitButton>
    </form>
  );
}
