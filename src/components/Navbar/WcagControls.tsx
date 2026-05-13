// WCAG Controls Architecture:
// This component manages global accessibility overrides (High Contrast & Font Scaling).
// It directly mutates the DOM (adding classes and CSS Custom Properties to the `<html>` root element)
// to ensure that layout updates happen synchronously without waiting for a full React state tree re-render.
// Preferences are synced with localStorage to persist across sessions.

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import style from './WcagControls.module.scss';

export default function WcagControls({
  groupLabel,
  decreaseFont,
  increaseFont,
  toggleContrast,
}: {
  groupLabel: string;
  decreaseFont: string;
  increaseFont: string;
  toggleContrast: string;
}) {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeOffset, setFontSizeOffset] = useState(0);

  // Dynamic Compact Layout Calculation:
  // When the font size scales up significantly, standard desktop layouts break.
  // We calculate an 'effectiveWidth' dividing actual pixel width by the scale factor.
  // If the effective width drops below tablet breakpoints, we forcefully apply
  // global `.compact-layout` classes, forcing the UI into mobile-view even on desktop.
  const updateCompactClasses = (scale: number) => {
    const effectiveWidth = window.innerWidth / scale;
    const root = document.documentElement.classList;

    root.toggle('compact-layout', effectiveWidth < 1024);
    root.toggle('compact-layout-sm', effectiveWidth < 768);
  };

  useEffect(() => {
    const savedContrast = localStorage.getItem('wcag-high-contrast') === 'true';
    const savedFontOffset = parseInt(
      localStorage.getItem('wcag-font-offset') || '0',
      10
    );

    if (savedContrast) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighContrast(true);
      document.documentElement.classList.add('wcag-high-contrast');
    }

    const scale = 1 + (!isNaN(savedFontOffset) ? savedFontOffset : 0) * 0.1;

    if (!isNaN(savedFontOffset) && savedFontOffset !== 0) {
      setFontSizeOffset(savedFontOffset);
      document.documentElement.style.setProperty(
        '--wcag-font-scale',
        scale.toString()
      );
    }

    updateCompactClasses(scale);

    const onResize = () => {
      const currentScale = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--wcag-font-scale'
        ) || '1'
      );
      updateCompactClasses(currentScale);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    if (newValue) {
      document.documentElement.classList.add('wcag-high-contrast');
      localStorage.setItem('wcag-high-contrast', 'true');
    } else {
      document.documentElement.classList.remove('wcag-high-contrast');
      localStorage.setItem('wcag-high-contrast', 'false');
    }
  };

  const changeFontSize = (step: number) => {
    // Restrict offset bounds (e.g. max 6 steps)
    const newOffset = Math.min(Math.max(fontSizeOffset + step, 0), 6);
    setFontSizeOffset(newOffset);
    localStorage.setItem('wcag-font-offset', newOffset.toString());

    // Scale is mathematically calculated where 1 step = 10% increase
    const scale = 1 + newOffset * 0.1;

    if (newOffset === 0) {
      document.documentElement.style.removeProperty('--wcag-font-scale');
    } else {
      document.documentElement.style.setProperty(
        '--wcag-font-scale',
        scale.toString()
      );
    }

    updateCompactClasses(scale);

    // Force full DOM repaint:
    // Sometimes Chromium-based browsers fail to update deep deeply nested REM values
    // dynamically. Toggling body display forces the browser compositor to recalculate everything.
    requestAnimationFrame(() => {
      document.body.style.display = 'none';
      void document.body.offsetHeight;
      document.body.style.display = '';
    });
  };

  return (
    <div className={style.wcagControls} role="group" aria-label={groupLabel}>
      <button
        onClick={() => changeFontSize(-1)}
        className={style.wcagButton}
        aria-label={decreaseFont}
        title={decreaseFont}
      >
        <span className={style.wcagTextSmall}>A</span>-
      </button>
      <button
        onClick={() => changeFontSize(1)}
        className={style.wcagButton}
        aria-label={increaseFont}
        title={increaseFont}
      >
        <span className={style.wcagTextLarge}>A</span>+
      </button>
      <button
        onClick={toggleHighContrast}
        className={clsx(style.wcagButton, { [style.active]: highContrast })}
        aria-label={toggleContrast}
        title={toggleContrast}
      >
        <svg
          fill="currentColor"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v16z" />
        </svg>
      </button>
    </div>
  );
}
