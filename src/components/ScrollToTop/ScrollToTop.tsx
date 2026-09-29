'use client';

import { useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import style from './ScrollToTop.module.scss';

/**
 * Floating "scroll to top" button that appears when the user
 * has scrolled past a threshold (300px). Smoothly scrolls
 * back to the top of the page.
 */
const subscribe = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};

export default function ScrollToTop() {
  const t = useTranslations('NewsDetails');
  // Read on hydration too: a page restored mid-way (back button) shows the
  // button without waiting for the next scroll
  const visible = useSyncExternalStore(
    subscribe,
    () => window.scrollY > 300,
    () => false
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={clsx(style.scrollToTop, visible && style.visible)}
      onClick={scrollToTop}
      aria-label={t('scrollToTop')}
      title={t('scrollToTop')}
    >
      <ArrowUp aria-hidden="true" size={24} />
    </button>
  );
}
