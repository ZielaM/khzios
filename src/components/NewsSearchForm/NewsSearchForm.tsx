'use client';

// Filters live in local state for instant feedback and are written to the
// URL (debounced); the server page renders results from the URL, so every
// search can be shared or bookmarked.

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

  const [isInputFocused, setIsInputFocused] = useState(false);

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

      if (nextParams) {
        // replace: intermediate queries typed by the user are not history entries
        router.replace(`${pathname}?${nextParams.toString()}`, {
          scroll: false,
        });
      }
    },
    [searchParams, pathname, router]
  );

  // Update the URL 500 ms after the last change, not on every keystroke
  useEffect(() => {
    if (isSkeleton) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
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
      className={style.searchForm}
      data-testid={
        isSkeleton ? 'news-search-form-skeleton' : 'news-search-form'
      }
    >
      <div className={style.searchInput}>
        <Search aria-hidden="true" className={style.icon} size={20} />
        <input
          data-testid={isSkeleton ? 'search-input-skeleton' : 'search-input'}
          type="text"
          placeholder={t('searchPlaceholder')}
          aria-label={isSkeleton ? undefined : t('searchPlaceholder')}
          value={query}
          maxLength={256}
          disabled={isSkeleton}
          onChange={(e) => {
            const val = e.target.value;
            // Starting a query switches the sort to relevance
            if (!query && val) {
              setSelectedSort('relevance');
            }
            setQuery(val);
          }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
      </div>

      {availableTags.length > 0 && (
        <fieldset className={style.tagFilter} disabled={isSkeleton}>
          <legend className={style.label}>{t('tagsLabel')}</legend>
          {availableTags.map((tag) => {
            const selected = selectedTags.includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                aria-pressed={selected}
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
      )}

      <div className={style.fields}>
        <label className={style.field}>
          <span className={style.label}>{t('dateFrom')}</span>
          <input
            type="date"
            className={style.dateInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={isSkeleton}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
        </label>
        <label className={style.field}>
          <span className={style.label}>{t('dateTo')}</span>
          <input
            type="date"
            className={style.dateInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={isSkeleton}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
        </label>
        {/* Relevance only makes sense for a text query */}
        {query && (
          <label className={style.field}>
            <span className={style.label}>{t('sortBy')}</span>
            <select
              className={style.sortSelect}
              value={selectedSort}
              disabled={isSkeleton}
              onChange={(e) => setSelectedSort(e.target.value as SortBy)}
            >
              <option value="relevance">{t('sortRelevance')}</option>
              <option value="date">{t('sortDate')}</option>
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
