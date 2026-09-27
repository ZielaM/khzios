'use client';

import { useState } from 'react';
import clsx from 'clsx';
import style from './forms.module.scss';

/**
 * Error or confirmation after a form action, announced to screen readers.
 * Confirmations fade out after a few seconds (hovering keeps them); errors
 * stay until the next attempt. Forms remount it for every submission.
 */
export default function FormMessage({
  error,
  message,
  persistent = false,
}: {
  error?: string;
  message?: string;
  /** Keep a confirmation that goes with something to copy */
  persistent?: boolean;
}) {
  const [faded, setFaded] = useState(false);
  if (error) {
    return (
      <p className={style.error} role="alert">
        {error}
      </p>
    );
  }
  if (!message || faded) return null;
  return (
    <p
      className={clsx(style.success, !persistent && style.fading)}
      role="status"
      onAnimationEnd={() => setFaded(true)}
    >
      {message}
    </p>
  );
}
