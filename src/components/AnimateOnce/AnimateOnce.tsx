'use client';

import { useEffect, useRef } from 'react';
import style from './AnimateOnce.module.scss';

interface AnimateOnceProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that applies a one-shot fade-in-up animation on mount.
 *
 * Unlike bare CSS `animation` on server-rendered elements, this approach
 * is immune to animation replays caused by WCAG font-scaling's force-repaint
 * (`display: none` toggle). The animation class is added once via useEffect
 * and the `animationend` listener removes it immediately after completion,
 * so subsequent repaints have nothing to replay.
 */
export default function AnimateOnce({ children, className }: AnimateOnceProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Add animation class on mount
    el.classList.add(style.animate);

    // Remove animation class after it completes — prevents replay on repaint
    const handleEnd = () => el.classList.remove(style.animate);
    el.addEventListener('animationend', handleEnd);

    return () => el.removeEventListener('animationend', handleEnd);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
