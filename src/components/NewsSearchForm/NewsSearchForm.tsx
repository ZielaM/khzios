'use client';

// NewsSearchForm Architecture:
// This component acts as the control panel for filtering and sorting news articles.
// It manages local state for instantaneous UI feedback (typing, selecting dropdowns)
// but synchronizes its final state to the URL search parameters via debouncing.
// This ensures that the URL always represents the exact view, making searches
// shareable and bookmarkable, while triggering server-side data fetching.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import style from './NewsSearchForm.module.scss';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { computeNextSearchParams } from '@/lib/url-utils';
import { SortBy } from '@/types/search-types';

interface NewsSearchFormProps {
  initialQuery?: string;
  initialTag?: string;
  initialSort: SortBy;
  initialDateFrom?: string;
  initialDateTo?: string;
  availableTags: TagOption[];
  isSkeleton?: boolean;
}

type TagOption = { value: string; label: string };

export default function NewsSearchForm({
  initialQuery,
  initialTag,
  initialSort,
  initialDateFrom,
  initialDateTo,
  availableTags,
  isSkeleton = false,
}: NewsSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('NewsPage');

  // Convert comma-separated string from URL into an array of selected values
  const initialTagsList = initialTag
    ? initialTag
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const [query, setQuery] = useState(initialQuery || '');
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);

  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTagsList.filter((tag) => availableTags.some((t) => t.value === tag))
  );
  const [prevInitialTag, setPrevInitialTag] = useState(initialTag);

  const [selectedSort, setSelectedSort] = useState<SortBy>(initialSort);
  const [prevInitialSort, setPrevInitialSort] = useState(initialSort);

  const [dateFrom, setDateFrom] = useState(initialDateFrom || '');
  const [prevInitialDateFrom, setPrevInitialDateFrom] =
    useState(initialDateFrom);

  const [dateTo, setDateTo] = useState(initialDateTo || '');
  const [prevInitialDateTo, setPrevInitialDateTo] = useState(initialDateTo);

  const [isExpanded, setIsExpanded] = useState(
    Boolean(initialQuery || initialTagsList.length > 0)
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (!query && selectedTags.length === 0 && !dateFrom && !dateTo) {
          setIsExpanded(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [query, selectedTags, dateFrom, dateTo]);

  if (
    initialQuery !== prevInitialQuery ||
    initialTag !== prevInitialTag ||
    initialSort !== prevInitialSort ||
    initialDateFrom !== prevInitialDateFrom ||
    initialDateTo !== prevInitialDateTo
  ) {
    setPrevInitialQuery(initialQuery);
    setPrevInitialTag(initialTag);
    setPrevInitialSort(initialSort);
    setPrevInitialDateFrom(initialDateFrom);
    setPrevInitialDateTo(initialDateTo);

    if (!isSkeleton) {
      if (!isInputFocused) {
        setQuery(initialQuery || '');
        setDateFrom(initialDateFrom || '');
        setDateTo(initialDateTo || '');
      }
      setSelectedTags(
        initialTagsList.filter((tag) =>
          availableTags.some((t) => t.value === tag)
        )
      );
      setSelectedSort(initialSort);
    }
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const applyChanges = useCallback(
    (
      newQuery: string,
      newTags: string[],
      newSort: string,
      newDateFrom: string,
      newDateTo: string
    ) => {
      const nextParams = computeNextSearchParams(
        new URLSearchParams(searchParams.toString()),
        newQuery,
        newTags,
        newSort,
        newDateFrom,
        newDateTo
      );

      // Only push router state if a param was actually modified.
      if (nextParams) {
        // replace: intermediate queries typed by the user are not history entries
        router.replace(`${pathname}?${nextParams.toString()}`, {
          scroll: false,
        });
      }
    },
    [searchParams, pathname, router]
  );

  // Debouncing effect:
  // Waits 500ms after the user stops interacting before pushing URL changes.
  // This prevents spamming the server with requests while the user is typing.
  useEffect(() => {
    if (isSkeleton) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      /* istanbul ignore next */
      applyChanges(query, selectedTags, selectedSort, dateFrom, dateTo);
    }, 500);
    return () => {
      clearTimeout(timerRef.current as NodeJS.Timeout);
    };
  }, [
    query,
    selectedTags,
    selectedSort,
    dateFrom,
    dateTo,
    applyChanges,
    isSkeleton,
  ]);

  return (
    <div
      className={`${style.searchContainer} ${
        isExpanded ? style.expandedContainer : style.collapsedContainer
      }`}
    >
      <div
        ref={containerRef}
        className={`${style.searchForm} ${
          isExpanded ? style.expanded : style.collapsed
        }`}
        data-testid={
          isSkeleton ? 'news-search-form-skeleton' : 'news-search-form'
        }
        onClick={() => {
          if (!isExpanded && !isSkeleton) {
            setIsExpanded(true);
          }
        }}
      >
        <button
          className={style.collapsedButton}
          aria-label={t('searchPlaceholder')}
          type="button"
          tabIndex={isExpanded ? -1 : 0}
        >
          <Search aria-hidden="true" size={24} />
        </button>

        <div className={style.inputGroup}>
          <div className={style.searchInput}>
            <Search aria-hidden="true" className={style.icon} size={20} />
            <input
              data-testid={
                isSkeleton ? 'search-input-skeleton' : 'search-input'
              }
              type="text"
              placeholder={t('searchPlaceholder')}
              aria-label={isSkeleton ? undefined : t('searchPlaceholder')}
              value={query}
              maxLength={256}
              disabled={isSkeleton}
              tabIndex={!isExpanded ? -1 : 0}
              onChange={(e) => {
                const val = e.target.value;
                // Quality of life feature: if the user starts typing a query,
                // automatically switch sort method to relevance for better initial results.
                if (!query && val) {
                  setSelectedSort('relevance');
                }
                setQuery(val);
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </div>

          <fieldset className={style.tagFilter} disabled={isSkeleton}>
            <legend className={style.visuallyHidden}>{t('tagsLabel')}</legend>
            {availableTags.map((tag) => {
              const selected = selectedTags.includes(tag.value);
              return (
                <button
                  key={tag.value}
                  type="button"
                  aria-pressed={selected}
                  tabIndex={!isExpanded ? -1 : 0}
                  className={clsx(style.tagChip, selected && style.selected)}
                  onClick={() =>
                    setSelectedTags((current) =>
                      selected
                        ? current.filter((v) => v !== tag.value)
                        : [...current, tag.value]
                    )
                  }
                >
                  {tag.label}
                </button>
              );
            })}
          </fieldset>

          {/* Relevance only makes sense for a text query */}
          {query && (
            <select
              className={style.sortSelect}
              aria-label={t('sortBy')}
              value={selectedSort}
              disabled={isSkeleton}
              tabIndex={!isExpanded ? -1 : 0}
              onChange={(e) => setSelectedSort(e.target.value as SortBy)}
            >
              <option value="relevance">{t('sortRelevance')}</option>
              <option value="date">{t('sortDate')}</option>
            </select>
          )}

          <div className={style.dateFilter}>
            <input
              type="date"
              className={style.dateInput}
              aria-label={t('dateFrom')}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={isSkeleton}
              tabIndex={!isExpanded ? -1 : 0}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            <span className={style.dateSeparator} aria-hidden="true">
              –
            </span>
            <input
              type="date"
              className={style.dateInput}
              aria-label={t('dateTo')}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={isSkeleton}
              tabIndex={!isExpanded ? -1 : 0}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
