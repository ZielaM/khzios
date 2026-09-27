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
    const form = formRef.current;
    const data = submitted.current;
    if (!state.error || !form || !data) return;
    for (const element of Array.from(form.elements)) {
      if (element instanceof HTMLInputElement) {
        if (
          !element.name ||
          element.type === 'file' ||
          element.type === 'hidden'
        )
          continue;
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = data.getAll(element.name).includes(element.value);
        } else {
          element.value = String(data.get(element.name) ?? '');
        }
      } else if (
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        if (element.name) element.value = String(data.get(element.name) ?? '');
      }
    }
  }, [state]);

  return {
    formRef,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      submitted.current = new FormData(e.currentTarget);
    },
  };
}
