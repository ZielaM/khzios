'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import style from './Pagination.module.scss';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());

    router.push(`${pathname}?${params.toString()}`, { scroll: true });
  };

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // Prosta logika dla przycisków: pokazujemy pierwszą, ostatnią i sąsiadujące
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...');
    }
  }

  // Usuwanie powielonych elips
  const filteredPages = pages.filter(
    (p, i, arr) => p !== '...' || arr[i - 1] !== '...'
  );

  if (totalPages <= 1) return null;

  return (
    <div className={style.pagination}>
      <button
        className={style.navButton}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={20} />
      </button>

      {filteredPages.map((p, i) => (
        <button
          key={i}
          className={`${style.pageButton} ${p === currentPage ? style.active : ''} ${p === '...' ? style.dots : ''}`}
          onClick={() => typeof p === 'number' && handlePageChange(p)}
          disabled={p === '...'}
        >
          {p}
        </button>
      ))}

      <button
        className={style.navButton}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
