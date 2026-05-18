'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import style from './ScrollToTop.module.scss';

/**
 * Floating "scroll to top" button that appears when the user
 * has scrolled past a threshold (300px). Smoothly scrolls
 * back to the top of the page.
 */
export default function ScrollToTop() {
  const t = useTranslations('NewsDetails');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`${style.scrollToTop} ${visible ? style.visible : ''}`}
      onClick={scrollToTop}
      aria-label={t('scrollToTop')}
      title={t('scrollToTop')}
    >
      <ArrowUp size={24} aria-hidden="true" />
    </button>
  );
}
