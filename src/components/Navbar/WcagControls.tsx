// High contrast and font scaling. Settings are applied directly to <html>
// (class and CSS variable) so the whole page updates at once, and stored in
// localStorage; the inline script in the root layout reapplies them before
// the first paint.

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

  // Scaled-up text needs the narrow layouts even on a wide window: compare
  // the window width divided by the scale with the layout breakpoints
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
    // 0–6 steps of 10% each
    const newOffset = Math.min(Math.max(fontSizeOffset + step, 0), 6);
    setFontSizeOffset(newOffset);
    localStorage.setItem('wcag-font-offset', newOffset.toString());

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

    // Force a full repaint: after a scale change Chromium sometimes leaves
    // stale copies of elements on screen until they are hovered
    requestAnimationFrame(() => {
      const currentScroll = window.scrollY;
      document.body.style.display = 'none';
      void document.body.offsetHeight;
      document.body.style.display = '';
      window.scrollTo(0, currentScroll);
    });
  };

  return (
    <div className={style.wcagControls} role="group" aria-label={groupLabel}>
      <button
        type="button"
        onClick={() => changeFontSize(-1)}
        className={style.wcagButton}
        aria-label={decreaseFont}
        title={decreaseFont}
      >
        <span className={style.wcagTextSmall}>A</span>-
      </button>
      <button
        type="button"
        onClick={() => changeFontSize(1)}
        className={style.wcagButton}
        aria-label={increaseFont}
        title={increaseFont}
      >
        <span className={style.wcagTextLarge}>A</span>+
      </button>
      <button
        type="button"
        onClick={toggleHighContrast}
        className={clsx(style.wcagButton, { [style.active]: highContrast })}
        aria-label={toggleContrast}
        aria-pressed={highContrast}
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
