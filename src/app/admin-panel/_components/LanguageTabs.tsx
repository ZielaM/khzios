'use client';

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
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

/**
 * Tabs for the language versions of a record. Every panel stays in the
 * form (only hidden), so all languages are submitted together.
 */
export default function LanguageTabs({ panels }: { panels: LanguagePanel[] }) {
  const [active, setActive] = useState(0);
  const id = useId();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next =
      (active + (e.key === 'ArrowRight' ? 1 : -1) + panels.length) %
      panels.length;
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className={style.languageTabs}>
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
            <span
              className={clsx(style.tabState, panel.filled && style.filled)}
            >
              {panel.filled ? 'uzupełnione' : 'brak'}
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
          hidden={active !== i}
          className={style.tabPanel}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
