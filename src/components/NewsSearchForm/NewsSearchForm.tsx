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

interface NewsSearchFormProps {
  initialQuery?: string;
  initialTag?: string;
  initialSort: 'date' | 'relevance';
  availableTags: { value: string; label: string }[];
}

type OptionType = { value: string; label: string };

// React-Select Custom Styling Configuration:
// We use CSS Custom Properties (variables) defined in NewsSearchForm.module.scss
// to hook into react-select's JS-in-CSS style object. This allows us to handle
// themes like WCAG high-contrast mode purely through CSS without re-rendering JS.
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
  availableTags,
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
  const [selectedTags, setSelectedTags] = useState<OptionType[]>(
    availableTags.filter((t) => initialTagsList.includes(t.value))
  );

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const applyChanges = useCallback(
    (newQuery: string, newTags: string[], newSort: string) => {
      const nextParams = computeNextSearchParams(
        new URLSearchParams(searchParams.toString()),
        newQuery,
        newTags,
        newSort
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
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      applyChanges(
        query,
        selectedTags.map((t) => t.value),
        selectedSort.value
      );
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, selectedTags, selectedSort, applyChanges]);

  return (
    <div className={style.searchForm} data-testid="news-search-form">
      <div className={style.inputGroup}>
        <div className={style.searchInput}>
          <Search className={style.icon} size={20} aria-hidden="true" />
          <input
            data-testid="search-input"
            type="text"
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            value={query}
            maxLength={256}
            onChange={(e) => {
              const val = e.target.value;
              // Quality of life feature: if the user starts typing a query,
              // automatically switch sort method to relevance for better initial results.
              if (!query && val) {
                setSelectedSort(sortOptions[0]);
              }
              setQuery(val);
            }}
          />
        </div>

        <div className={style.selectWrapper}>
          <Select
            instanceId="news-tags-select"
            isMulti
            isSearchable
            placeholder={t('tagPlaceholder')}
            aria-label={t('tagPlaceholder')}
            options={availableTags}
            value={selectedTags}
            onChange={(newValue) => setSelectedTags(newValue as OptionType[])}
            styles={customSelectStyles}
            noOptionsMessage={() => t('noResults')}
          />
        </div>

        {/* Sorting is only revealed if there is an active search query 
            to avoid confusing the user with useless relevance sorts. */}
        {query && (
          <div className={style.selectWrapper}>
            <Select
              instanceId="news-sort-select"
              isSearchable={false}
              aria-label={t('sortBy')}
              options={sortOptions}
              value={selectedSort}
              onChange={(newValue) => setSelectedSort(newValue as OptionType)}
              styles={customSelectStyles}
            />
          </div>
        )}
      </div>
    </div>
  );
}
