'use client';

// Pagination Component Architecture:
// This is a client-side component that modifies the `page` URL search parameter.
// It relies on Next.js `useRouter` to push state changes. The actual data fetching
// and mathematical slicing happens on the server (e.g. in NewsGridServer),
// which reads the updated `page` parameter from the URL.

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import style from './Pagination.module.scss';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({
  currentPage,
  totalPages,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Pagination');

  // URL State Mutation:
  // We extract the current search params, modify only the 'page' value,
  // and push the new URL. This preserves active filters or sort methods.
  // `scroll: true` brings the user back to the top of the page when changing pages.
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());

    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  // Smart Page Range Generation Logic:
  // Instead of listing 50 buttons for 50 pages, we calculate a window.
  // We always show the first page, the last page, the current page,
  // and the immediate left/right neighbors.
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      // If a gap exists, insert a placeholder "..."
      pages.push('...');
    }
  }

  // Deduplication:
  // If the gap between pages is very small, the loop might insert multiple
  // "..." indicators consecutively. This filter removes duplicates.
  const filteredPages = pages.filter(
    (p, i, arr) => p !== '...' || arr[i - 1] !== '...'
  );

  // If there is only 1 page, pagination is meaningless, so hide the component entirely.
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={t('navLabel')} className={style.pagination}>
      {/* Previous Button */}
      <button
        className={style.navButton}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t('prev')}
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      {/* Numbered Page Buttons & Ellipses */}
      {filteredPages.map((p, i) => (
        <button
          key={i}
          className={`${style.pageButton} ${p === currentPage ? style.active : ''} ${p === '...' ? style.dots : ''}`}
          onClick={() => typeof p === 'number' && handlePageChange(p)}
          disabled={p === '...'}
          // Screen readers need specific context for "..." vs "Page X"
          aria-label={p === '...' ? t('more') : t('page', { page: p })}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {/* Next Button */}
      <button
        className={style.navButton}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t('next')}
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </nav>
  );
}
