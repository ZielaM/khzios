'use client';

import { useLayoutEffect, useRef, type FormEvent } from 'react';
import type { FormState } from '@/lib/admin/form';

/**
 * React clears a form once its action finishes, even when the server sent
 * back a validation error. This puts the submitted values back in that case,
 * so nothing typed is lost (browsers do not allow restoring chosen files).
 * The reset happens in the commit's mutation phase, before layout effects.
 */
export function useKeepValuesOnError(state: FormState) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef<FormData | null>(null);

  useLayoutEffect(() => {
    if (!state.error) return;
    // An error only ever comes back from a submission of this form
    const form = formRef.current!;
    const data = submitted.current!;
    for (const element of Array.from(form.elements)) {
      if (
        !(element instanceof HTMLInputElement) &&
        !(element instanceof HTMLTextAreaElement) &&
        !(element instanceof HTMLSelectElement)
      )
        continue;
      if (!element.name || element.type === 'file' || element.type === 'hidden')
        continue;
      if (
        element instanceof HTMLInputElement &&
        /^(checkbox|radio)$/.test(element.type)
      ) {
        element.checked = data.getAll(element.name).includes(element.value);
        continue;
      }
      // Disabled fields are not submitted: keep what the reset gave them
      const value = data.get(element.name);
      if (value !== null) element.value = String(value);
    }
  }, [state]);

  return {
    formRef,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      submitted.current = new FormData(e.currentTarget);
    },
  };
}
