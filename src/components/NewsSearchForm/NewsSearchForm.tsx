'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import style from './NewsSearchForm.module.scss';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import Select, { StylesConfig } from 'react-select';

interface NewsSearchFormProps {
  initialQuery?: string;
  initialTag?: string;
  initialSort: 'date' | 'relevance';
  availableTags: { value: string; label: string }[];
}

type OptionType = { value: string; label: string };

const customSelectStyles: StylesConfig<OptionType, boolean> = {
  control: (base, state) => ({
    ...base,
    padding: '0.2rem 0.5rem',
    borderRadius: '8px',
    borderColor: state.isFocused
      ? 'var(--color-primary)'
      : 'var(--border-dark, #d1d5db)',
    boxShadow: state.isFocused
      ? '0 0 0 3px rgba(36, 113, 81, 0.2)'
      : '0 1px 2px rgba(0,0,0,0.05)',
    '&:hover': {
      borderColor: '#9ca3af',
    },
    minWidth: '200px',
    background: 'var(--background, #ffffff)',
    cursor: 'pointer',
    fontSize: '1rem',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'var(--color-primary)'
      : state.isFocused
        ? 'rgba(36, 113, 81, 0.1)'
        : 'transparent',
    color: state.isSelected ? 'white' : 'var(--text-primary)',
    cursor: 'pointer',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'rgba(36, 113, 81, 0.1)',
    borderRadius: '4px',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'var(--color-primary)',
    fontWeight: 500,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--color-primary)',
    '&:hover': {
      backgroundColor: 'var(--color-primary)',
      color: 'white',
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
      { value: 'date', label: t('sortDate') },
      { value: 'relevance', label: t('sortRelevance') },
    ],
    [t]
  );

  const [selectedSort, setSelectedSort] = useState<OptionType>(
    sortOptions.find((o) => o.value === initialSort) || sortOptions[0]
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const applyChanges = useCallback(
    (newQuery: string, newTags: string[], newSort: string) => {
      const params = new URLSearchParams(searchParams.toString());
      let changed = false;

      if (newQuery) {
        if (params.get('szukaj') !== newQuery) {
          params.set('szukaj', newQuery);
          changed = true;
        }
      } else if (params.has('szukaj')) {
        params.delete('szukaj');
        changed = true;
      }

      if (newTags.length > 0) {
        const tagsString = newTags.join(',');
        if (params.get('tag') !== tagsString) {
          params.set('tag', tagsString);
          changed = true;
        }
      } else if (params.has('tag')) {
        params.delete('tag');
        changed = true;
      }

      const finalSort =
        newQuery && newSort === 'relevance' ? 'relevance' : 'date';
      if (params.get('sort') !== finalSort) {
        params.set('sort', finalSort);
        changed = true;
      }

      if (changed) {
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [searchParams, pathname, router]
  );

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
    <div className={style.searchForm}>
      <div className={style.inputGroup}>
        <div className={style.searchInput}>
          <Search className={style.icon} size={20} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val && selectedSort.value === 'relevance') {
                setSelectedSort(sortOptions[0]);
              }
            }}
          />
        </div>

        <div className={style.selectWrapper}>
          <Select
            instanceId="news-tags-select"
            isMulti
            isSearchable
            placeholder={t('tagPlaceholder')}
            options={availableTags}
            value={selectedTags}
            onChange={(newValue) => setSelectedTags(newValue as OptionType[])}
            styles={customSelectStyles}
            noOptionsMessage={() => t('noResults')}
          />
        </div>

        {query && (
          <div className={style.selectWrapper}>
            <Select
              instanceId="news-sort-select"
              isSearchable={false}
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
