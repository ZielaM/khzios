'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import clsx from 'clsx';
import style from './forms.module.scss';

export default function SubmitButton({
  children,
  variant = 'primary',
  pendingLabel = 'Zapisywanie…',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={clsx(style.button, style[variant])}
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
