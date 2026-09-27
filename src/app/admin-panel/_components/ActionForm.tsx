'use client';

import { useActionState, type ReactNode } from 'react';
import clsx from 'clsx';
import type { FormState } from '@/lib/admin/form';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import { useKeepValuesOnError } from './useKeepValuesOnError';
import style from './forms.module.scss';

interface ActionFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  wide?: boolean;
}

/** A form bound to a server action, with its message and submit button. */
export default function ActionForm({
  action,
  submitLabel,
  children,
  wide,
}: ActionFormProps) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    {}
  );
  const { formRef, onSubmit } = useKeepValuesOnError(state);
  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      className={clsx(style.form, wide && style.wideForm)}
    >
      {!isPending && (
        <FormMessage
          error={state.error}
          message={state.message}
          persistent={Boolean(state.password || state.recoveryCodes)}
        />
      )}
      {state.password && (
        <p className={style.secret}>
          Hasło tymczasowe (pokazane tylko teraz): <code>{state.password}</code>
        </p>
      )}
      {state.recoveryCodes && (
        <>
          <p>
            Nowe kody zapasowe (pokazane tylko teraz; poprzednie przestały
            działać):
          </p>
          <ul className={style.codes}>
            {state.recoveryCodes.map((code) => (
              <li key={code}>
                <code>{code}</code>
              </li>
            ))}
          </ul>
        </>
      )}
      {children}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
