'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import type { SiteImage } from '@/lib/site-images';
import style from './HeroSlideshow.module.scss';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
  query?.addEventListener?.('change', onChange);
  return () => query?.removeEventListener?.('change', onChange);
}

const prefersReducedMotion = () =>
  window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;

interface HeroSlideshowProps {
  images: SiteImage[];
  /** Time each photo stays fully visible before cross-fading, in ms */
  intervalMs?: number;
}

/**
 * Cross-fading photos that fill their positioned parent (the home page
 * hero's photo panel).
 *
 * Accessibility (WCAG 2.2.2): auto-rotation can be paused with a button and
 * never starts for users who prefer reduced motion. Only the visible photo
 * is exposed to assistive technology.
 *
 * Performance: the first photo is preloaded (LCP candidate); each following
 * photo is mounted one step ahead of being shown instead of all at once.
 */
export default function HeroSlideshow({
  images,
  intervalMs = 7000,
}: HeroSlideshowProps) {
  const t = useTranslations('HeroSlideshow');
  const [active, setActive] = useState(0);
  const [furthest, setFurthest] = useState(0);
  // null = the user hasn't touched the button; follow the motion preference
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    () => false
  );
  const paused = userPaused ?? reducedMotion;

  const canRotate = images.length > 1;

  useEffect(() => {
    if (!canRotate || paused) return;

    const timer = setTimeout(() => {
      const next = (active + 1) % images.length;
      setActive(next);
      setFurthest((prev) => Math.max(prev, next));
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [active, paused, canRotate, images.length, intervalMs]);

  if (images.length === 0) return null;

  return (
    <div className={style.slideshow}>
      {images.map(
        (image, index) =>
          index <= furthest + 1 && (
            <Image
              key={image.src}
              src={image.src}
              alt={index === active ? image.alt : ''}
              aria-hidden={index !== active}
              fill
              preload={index === 0}
              sizes="(max-width: 768px) 100vw, 480px"
              className={clsx(style.slide, index === active && style.active)}
            />
          )
      )}

      {canRotate && (
        <button
          type="button"
          className={style.toggle}
          onClick={() => setUserPaused(!paused)}
          aria-label={paused ? t('play') : t('pause')}
        >
          {paused ? (
            <Play aria-hidden="true" size={18} />
          ) : (
            <Pause aria-hidden="true" size={18} />
          )}
        </button>
      )}
    </div>
  );
}
