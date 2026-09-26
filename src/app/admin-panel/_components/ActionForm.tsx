'use client';

import { useActionState, type ReactNode } from 'react';
import clsx from 'clsx';
import type { FormState } from '@/lib/admin/form';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
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
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  return (
    <form
      action={formAction}
      className={clsx(style.form, wide && style.wideForm)}
    >
      <FormMessage error={state.error} message={state.message} />
      {children}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
