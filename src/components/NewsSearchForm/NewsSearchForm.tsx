'use client';

// NewsSearchForm Architecture:
// This component acts as the control panel for filtering and sorting news articles.
// It manages local state for instantaneous UI feedback (typing, selecting dropdowns)
// but synchronizes its final state to the URL search parameters via debouncing.
// This ensures that the URL always represents the exact view, making searches
// shareable and bookmarkable, while triggering server-side data fetching.

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import style from './NewsSearchForm.module.scss';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import { computeNextSearchParams } from '@/lib/url-utils';
import { SortBy } from '@/types/search-types';

interface NewsSearchFormProps {
  initialQuery?: string;
  initialTag?: string;
  initialSort: SortBy;
  initialDateFrom?: string;
  initialDateTo?: string;
  availableTags: { value: string; label: string }[];
  isSkeleton?: boolean;
}

type OptionType = { value: string; label: string };

// React-Select Custom Styling Configuration:
// We use CSS Custom Properties (variables) defined in NewsSearchForm.module.scss
// to hook into react-select's JS-in-CSS style object. This allows us to handle
// themes like WCAG high-contrast mode purely through CSS without re-rendering JS.
/* istanbul ignore next */
const customSelectStyles: StylesConfig<OptionType, boolean> = {
  control: (base, state) => ({
    ...base,
    padding: '0.2rem 0.5rem',
    borderRadius: '8px',
    borderColor: state.isFocused
      ? 'var(--rs-border-focus)'
      : 'var(--rs-border)',
    boxShadow: state.isFocused ? 'var(--rs-shadow-focus)' : 'var(--rs-shadow)',
    '&:hover': {
      borderColor: 'var(--rs-border-focus)',
    },
    background: 'var(--rs-bg)',
    cursor: 'pointer',
    fontSize: '1rem',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    background: 'var(--rs-bg)',
    border: '1px solid var(--rs-border)',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'var(--rs-option-selected)'
      : state.isFocused
        ? 'var(--rs-option-hover)'
        : 'transparent',
    color: state.isSelected
      ? 'var(--rs-option-selected-text)'
      : state.isFocused
        ? 'var(--rs-option-hover-text)'
        : 'var(--rs-text)',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--rs-text)',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'var(--rs-multi-bg)',
    borderRadius: '4px',
    border: '1px solid var(--rs-border)',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'var(--rs-multi-text)',
    fontWeight: 500,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--rs-multi-text)',
    '&:hover': {
      backgroundColor: 'var(--rs-option-selected)',
      color: 'var(--rs-option-selected-text)',
    },
  }),
};

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

  const [selectedTags, setSelectedTags] = useState<OptionType[]>(
    availableTags.filter((t) => initialTagsList.includes(t.value))
  );
  const [prevInitialTag, setPrevInitialTag] = useState(initialTag);

  const sortOptions: OptionType[] = useMemo(
    () => [
      { value: 'relevance', label: t('sortRelevance') },
      { value: 'date', label: t('sortDate') },
    ],
    [t]
  );

  const [selectedSort, setSelectedSort] = useState<OptionType>(
    sortOptions.find((o) => o.value === initialSort) || sortOptions[0]
  );
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
        availableTags.filter((t) => initialTagsList.includes(t.value))
      );
      setSelectedSort(
        sortOptions.find((o) => o.value === initialSort) || sortOptions[0]
      );
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
        router.push(`${pathname}?${nextParams.toString()}`, { scroll: false });
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
      applyChanges(
        query,
        selectedTags.map((t) => t.value),
        selectedSort.value,
        dateFrom,
        dateTo
      );
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
                  setSelectedSort(sortOptions[0]);
                }
                setQuery(val);
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </div>

          <div className={style.selectWrapper}>
            <Select
              instanceId="news-tags-select"
              isMulti
              isSearchable={!isSkeleton}
              isDisabled={isSkeleton}
              placeholder={t('tagPlaceholder')}
              aria-label={isSkeleton ? undefined : t('tagPlaceholder')}
              options={availableTags}
              value={selectedTags}
              /* istanbul ignore next */
              onChange={(newValue) => setSelectedTags(newValue as OptionType[])}
              styles={customSelectStyles}
              noOptionsMessage={() => t('noResults')}
              tabIndex={!isExpanded ? -1 : 0}
            />
          </div>

          {/* Sorting is only revealed if there is an active search query 
              to avoid confusing the user with useless relevance sorts. */}
          {query && (
            <div className={style.selectWrapper}>
              <Select
                instanceId="news-sort-select"
                isSearchable={false}
                isDisabled={isSkeleton}
                aria-label={isSkeleton ? undefined : t('sortBy')}
                options={sortOptions}
                value={selectedSort}
                /* istanbul ignore next */
                onChange={(newValue) => setSelectedSort(newValue as OptionType)}
                styles={customSelectStyles}
                tabIndex={!isExpanded ? -1 : 0}
              />
            </div>
          )}

          <div className={style.dateFilter}>
            <input
              type="date"
              className={style.dateInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={isSkeleton}
              tabIndex={!isExpanded ? -1 : 0}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            <span className={style.dateSeparator}>-</span>
            <input
              type="date"
              className={style.dateInput}
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
