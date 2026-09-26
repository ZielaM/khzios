'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';
import style from './forms.module.scss';

/** Submit button that asks for confirmation first (deleting, restoring). */
export default function ConfirmButton({
  children,
  message,
  variant = 'danger',
}: {
  children: ReactNode;
  message: string;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <button
      type="submit"
      className={clsx(style.button, style[variant])}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
