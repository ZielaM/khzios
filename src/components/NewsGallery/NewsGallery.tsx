'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { NewsPhoto } from '@/lib/news-queries';
import { getPhotoAlt } from '@/lib/content-utils';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import style from './NewsGallery.module.scss';
import clsx from 'clsx';

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

  const openLightbox = (index: number) => {
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

  // Handle keyboard navigation, scroll locking, and touch swipe
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchend', handleTouchEnd);

    // Prevent scrolling globally when lightbox is open
    // Blocking both root and body ensures scroll is blocked in all browsers
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
          className={style.lightbox}
          role="dialog"
          aria-modal="true"
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
              /* istanbul ignore next */
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
            /* istanbul ignore next */
            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking on image
          >
            <Image
              src={photos[selectedIndex].url}
              alt={altFor(selectedIndex)}
              fill
              className={style.lightboxImage}
              sizes="100vw"
              priority
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
              /* istanbul ignore next */
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
