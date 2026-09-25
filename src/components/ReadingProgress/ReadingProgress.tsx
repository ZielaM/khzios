'use client';

import { useState, useEffect } from 'react';
import style from './ReadingProgress.module.scss';

/**
 * Thin progress bar fixed at the top of the viewport.
 * Shows how far the user has scrolled through the article content.
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    // Purely visual: announcing every scroll step would only be noise
    <div className={style.progressBar} aria-hidden="true">
      <div className={style.progressFill} style={{ width: `${progress}%` }} />
    </div>
  );
}
