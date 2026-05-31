'use client';

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import style from './AnimateOnce.module.scss';

interface AnimateOnceProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that applies a one-shot fade-in-up animation when the element
 * scrolls into the viewport via IntersectionObserver.
 *
 * The element starts visually hidden (opacity: 0, translateY offset) and
 * transitions in once it enters the viewport. After the animation completes,
 * the animation class is removed immediately so that WCAG font-scaling's
 * force-repaint (`display: none` toggle) cannot replay it.
 *
 * The observer disconnects after the first intersection — truly "once".
 */
export default function AnimateOnce({ children, className }: AnimateOnceProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    /* istanbul ignore next */
    if (!el) return;

    // If IntersectionObserver is unavailable (e.g. old browsers, test env),
    // show the element immediately without animation.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add(style.visible);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Trigger animation
          el.classList.add(style.animate);

          // Remove animation class after it completes — prevents replay on repaint
          const handleEnd = () => {
            el.classList.remove(style.animate);
            el.classList.add(style.visible);
          };
          el.addEventListener('animationend', handleEnd, { once: true });

          // Stop observing — this element only animates once
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={clsx(style.wrapper, className)}>
      {children}
    </div>
  );
}
