'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import style from './PublicationsSearchForm.module.scss';

interface PublicationsSearchFormProps {
  initialQuery?: string;
  isSkeleton?: boolean;
}

export default function PublicationsSearchForm({
  initialQuery = '',
  isSkeleton = false,
}: PublicationsSearchFormProps) {
  const t = useTranslations('PublicationsPage');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    if (!isSkeleton && !isInputFocused) {
      setQuery(initialQuery);
    }
  }

  const applyChanges = useCallback(
    (newQuery: string) => {
      const currentQuery = searchParams.get('query') || '';
      const trimmedQuery = newQuery.trim();

      if (trimmedQuery === currentQuery) {
        return; // Prevents infinite loop and unnecessary requests
      }

      const params = new URLSearchParams(searchParams.toString());
      if (trimmedQuery) {
        params.set('query', trimmedQuery);
      } else {
        params.delete('query');
      }
      // Reset to page 1 on new search
      params.delete('page');

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    if (isSkeleton) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      applyChanges(query);
    }, 500);
    return () => {
      clearTimeout(timerRef.current as NodeJS.Timeout);
    };
  }, [query, applyChanges, isSkeleton]);

  return (
    <div className={style.form}>
      <div className={style.searchBox}>
        <div className={style.inputWrapper}>
          <Search aria-hidden="true" className={style.searchIcon} size={20} />
          <input
            type="text"
            className={style.input}
            placeholder={t('searchPlaceholder')}
            aria-label={isSkeleton ? undefined : t('searchPlaceholder')}
            value={query}
            disabled={isSkeleton}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
