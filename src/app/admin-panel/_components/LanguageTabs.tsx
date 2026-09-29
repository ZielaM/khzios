'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import style from './forms.module.scss';

export interface LanguagePanel {
  code: string;
  label: string;
  /** Shown as "uzupełnione" or "brak" next to the tab */
  filled: boolean;
  required?: boolean;
  content: ReactNode;
}

/** Whether anything is typed in a panel (inputs or the article editor). */
function hasContent(panel: Element) {
  const fields = panel.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input:not([type="hidden"]):not([type="file"]), textarea'
  );
  const editors = panel.querySelectorAll('[contenteditable="true"]');
  return (
    Array.from(fields).some((f) => f.value.trim()) ||
    Array.from(editors).some((e) => e.textContent!.trim())
  );
}

/**
 * Tabs for the language versions of a record. Every panel stays in the
 * form (only hidden), so all languages are submitted together.
 */
export default function LanguageTabs({ panels }: { panels: LanguagePanel[] }) {
  const [active, setActive] = useState(0);
  const [filled, setFilled] = useState(() => panels.map((p) => p.filled));
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const root = rootRef.current!;
    const form = root.closest('form');
    if (!form) return;
    // Panel of this component holding the field, or -1 (another component's
    // tabs or a field outside any tabs)
    const panelIndex = (field: Element) => {
      const panel = field.closest('[data-panel]');
      return panel && root.contains(panel)
        ? Number(panel.getAttribute('data-panel'))
        : -1;
    };

    // A required field on a hidden tab would silently block the submit, so
    // show the tab of the first invalid field before the browser focuses it.
    // One validation fires its invalid events within a single task, with
    // microtasks run in between, hence the timeout.
    let checking = false;
    const onInvalid = (e: Event) => {
      if (checking) return;
      checking = true;
      setTimeout(() => (checking = false));
      // Invalid events are fired at form controls
      const index = panelIndex(e.target as Element);
      if (index >= 0) flushSync(() => setActive(index));
    };
    // Clearing the form after adding a record clears the tabs' state too
    const onReset = () =>
      setTimeout(() =>
        setFilled(Array.from(root.querySelectorAll('[data-panel]'), hasContent))
      );

    form.addEventListener('invalid', onInvalid, true);
    form.addEventListener('reset', onReset);
    return () => {
      form.removeEventListener('invalid', onInvalid, true);
      form.removeEventListener('reset', onReset);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next =
      (active + (e.key === 'ArrowRight' ? 1 : -1) + panels.length) %
      panels.length;
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)!.focus();
  };

  return (
    <div ref={rootRef} className={style.languageTabs}>
      <div role="tablist" aria-label="Wersje językowe" onKeyDown={onKeyDown}>
        {panels.map((panel, i) => (
          <button
            key={panel.code}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            className={clsx(style.tab, active === i && style.activeTab)}
            onClick={() => setActive(i)}
          >
            {panel.label}
            {panel.required && ' *'}
            <span className={clsx(style.tabState, filled[i] && style.filled)}>
              {filled[i] ? 'uzupełnione' : 'brak'}
            </span>
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={panel.code}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          data-panel={i}
          hidden={active !== i}
          className={style.tabPanel}
          onInput={(e) => {
            const now = hasContent(e.currentTarget);
            setFilled((prev) =>
              prev[i] === now ? prev : prev.map((f, j) => (j === i ? now : f))
            );
          }}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
