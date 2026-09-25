import Link from 'next/link';
import clsx from 'clsx';
import { getTranslations } from 'next-intl/server';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import style from './Pagination.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Localized path of the listing, e.g. `/pl/aktualnosci` */
  pathname: string;
  /** Current search parameters; kept on every page link */
  params: Record<string, string | undefined>;
}

type PageItem = number | 'gap';

/** First, last, current and its neighbours, with gaps in between. */
export function pageItems(currentPage: number, totalPages: number): PageItem[] {
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  sorted.forEach((page, i) => {
    const previous = sorted[i - 1];
    if (previous !== undefined && page - previous === 2) items.push(page - 1);
    else if (previous !== undefined && page - previous > 2) items.push('gap');
    items.push(page);
  });
  return items;
}

/**
 * Page links for server-rendered listings. Real links (rather than buttons)
 * let crawlers reach every page and keep each page bookmarkable.
 */
export default async function Pagination({
  currentPage,
  totalPages,
  pathname,
  params,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const t = await getTranslations('Pagination');

  const hrefFor = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== 'page') query.set(key, value);
    }
    if (page > 1) query.set('page', String(page));
    const qs = query.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const edge = (page: number, label: string, icon: React.ReactNode) =>
    page < 1 || page > totalPages ? (
      <span
        className={clsx(style.navButton, style.disabled)}
        aria-hidden="true"
      >
        {icon}
      </span>
    ) : (
      <Link href={hrefFor(page)} className={style.navButton} aria-label={label}>
        {icon}
      </Link>
    );

  return (
    <nav aria-label={t('navLabel')} className={style.pagination}>
      {edge(
        currentPage - 1,
        t('prev'),
        <ChevronLeft aria-hidden="true" size={20} />
      )}

      <ul className={style.pages}>
        {pageItems(currentPage, totalPages).map((item, i) => (
          <li key={item === 'gap' ? `gap-${i}` : item}>
            {item === 'gap' ? (
              <span
                className={clsx(style.pageButton, style.dots)}
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Link
                href={hrefFor(item)}
                className={clsx(
                  style.pageButton,
                  item === currentPage && style.active
                )}
                aria-label={t('page', { page: item })}
                aria-current={item === currentPage ? 'page' : undefined}
              >
                {item}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {edge(
        currentPage + 1,
        t('next'),
        <ChevronRight aria-hidden="true" size={20} />
      )}
    </nav>
  );
}
