'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import style from './ShareButton.module.scss';

interface ShareButtonProps {
  title: string;
}

/**
 * Share button with native Web Share API support.
 * Falls back to a "copy link" button on browsers that don't support
 * the Web Share API (most desktop browsers).
 */
export default function ShareButton({ title }: ShareButtonProps) {
  const t = useTranslations('NewsDetails');
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleShare = async () => {
    const url = window.location.href;

    // Try native share first (available on mobile and some desktop)
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or API failed — fall through to copy
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <button
      className={style.shareButton}
      onClick={handleShare}
      aria-label={t('share')}
      title={t('share')}
    >
      {copied ? (
        <>
          <Check aria-hidden="true" size={18} />
          <span>{t('linkCopied')}</span>
        </>
      ) : (
        <>
          <Share2 aria-hidden="true" size={18} />
          <span>{t('share')}</span>
        </>
      )}
    </button>
  );
}
