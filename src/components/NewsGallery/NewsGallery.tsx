'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Photo } from '@/generated/prisma/client';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import style from './NewsGallery.module.scss';
import clsx from 'clsx';

interface NewsGalleryProps {
  photos: Photo[];
}

export default function NewsGallery({ photos }: NewsGalleryProps) {
  const t = useTranslations('NewsDetails');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const showNext = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % photos.length);
    }
  }, [selectedIndex, photos.length]);

  const showPrev = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
    }
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
              alt={`Gallery thumbnail ${index + 1}`}
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
            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking on image
          >
            <Image
              src={photos[selectedIndex].url}
              alt={`Gallery image ${selectedIndex + 1}`}
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
