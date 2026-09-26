'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { NewsPhoto } from '@/lib/news-queries';
import { getPhotoAlt } from '@/lib/photos';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import style from './NewsGallery.module.scss';
import clsx from 'clsx';

/** Keeps Tab / Shift+Tab cycling through the buttons inside `container`. */
function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  const controls = container?.querySelectorAll<HTMLElement>('button');
  if (!controls || controls.length === 0) return;
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

interface NewsGalleryProps {
  photos: NewsPhoto[];
  /** Article title (plain text), used for photos without their own alt text */
  title: string;
  locale: string;
}

export default function NewsGallery({
  photos,
  title,
  locale,
}: NewsGalleryProps) {
  const t = useTranslations('NewsDetails');
  const altFor = (index: number) =>
    getPhotoAlt(
      photos[index],
      locale,
      t('galleryImageAlt', { title, current: index + 1, total: photos.length })
    );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  // The thumbnail that opened the lightbox gets focus back on close
  const openerRef = useRef<HTMLElement | null>(null);
  const isOpen = selectedIndex !== null;

  const openLightbox = (index: number) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const showNext = useCallback(() => {
    setSelectedIndex((selectedIndex! + 1) % photos.length);
  }, [selectedIndex, photos.length]);

  const showPrev = useCallback(() => {
    setSelectedIndex((selectedIndex! - 1 + photos.length) % photos.length);
  }, [selectedIndex, photos.length]);

  // Track touch position for swipe gesture detection
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const SWIPE_THRESHOLD = 50;

      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX < 0) showNext();
        else showPrev();
      }
      touchStartX.current = null;
    },
    [showNext, showPrev]
  );

  // While open: arrow keys and swipes change the photo, the page does not scroll
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'Tab') trapFocus(e, dialogRef.current);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchend', handleTouchEnd);

    // Some browsers scroll <html>, others <body>
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [selectedIndex, showNext, showPrev, handleTouchStart, handleTouchEnd]);

  // Move focus into the dialog when it opens and back to the opener when it
  // closes, so keyboard and screen reader users stay oriented
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    } else if (openerRef.current) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      <section className={style.gallery}>
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            className={style.galleryImageWrapper}
            onClick={() => openLightbox(index)}
            aria-label={t('imageCounter', {
              current: index + 1,
              total: photos.length,
            })}
          >
            <Image
              src={photo.url}
              alt={altFor(index)}
              fill
              className={style.galleryImage}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </button>
        ))}
      </section>

      {selectedIndex !== null && (
        <div
          ref={dialogRef}
          className={style.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={t('gallery')}
          onClick={closeLightbox}
        >
          <div className={style.lightboxOverlay} />

          <button
            className={style.closeButton}
            onClick={closeLightbox}
            aria-label={t('closeGallery')}
          >
            <X aria-hidden="true" size={32} />
          </button>

          {photos.length > 1 && (
            <button
              className={clsx(style.navButton, style.prevButton)}
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              aria-label={t('prevImage')}
            >
              <ChevronLeft aria-hidden="true" size={48} />
            </button>
          )}

          <div
            className={style.lightboxContent}
            // Clicks on the photo must not reach the backdrop, which closes
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[selectedIndex].url}
              alt={altFor(selectedIndex)}
              fill
              className={style.lightboxImage}
              sizes="100vw"
              preload
            />
            <div className={style.imageCounter}>
              {t('imageCounter', {
                current: selectedIndex + 1,
                total: photos.length,
              })}
            </div>
          </div>

          {photos.length > 1 && (
            <button
              className={clsx(style.navButton, style.nextButton)}
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              aria-label={t('nextImage')}
            >
              <ChevronRight aria-hidden="true" size={48} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
