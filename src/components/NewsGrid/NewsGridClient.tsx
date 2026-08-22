'use client';

import { useState } from 'react';
import { searchPublishedNews } from '@/actions/search';
import NewsTile from '@/components/NewsTile';
import style from './NewsGrid.module.scss';
import { SearchX, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SearchParams } from '@/types/search-types';
import {
  News,
  Tag,
  Photo,
  NewsTranslation,
  TagTranslation,
} from '@/generated/prisma/client';

type NewsItem = News & {
  tags: (Tag & { translations: TagTranslation[] })[];
  photos: Photo[];
  translations: NewsTranslation[];
};

interface NewsGridClientProps {
  initialData: NewsItem[];
  totalPages: number;
  searchParams: SearchParams;
}

export default function NewsGridClient({
  initialData,
  totalPages,
  searchParams,
}: NewsGridClientProps) {
  const [items, setItems] = useState<NewsItem[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(searchParams.page || 1);
  const [hasMore, setHasMore] = useState(currentPage < totalPages);

  const t = useTranslations('NewsPage');

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const isSearch = !!searchParams.query;

      const newParams: SearchParams = {
        ...searchParams,
      };

      if (isSearch) {
        newParams.page = currentPage + 1;
      } else {
        const lastItem = items[items.length - 1];
        if (lastItem) {
          newParams.cursorId = lastItem.id;
        }
      }

      const res = await searchPublishedNews(newParams);

      if (res.data.length > 0) {
        // use a Map to deduplicate in case of overlaps
        setItems((prev) => {
          const map = new Map(prev.map((i) => [i.id, i]));
          res.data.forEach((i) => map.set(i.id, i as NewsItem));
          return Array.from(map.values());
        });

        if (isSearch) {
          setCurrentPage(currentPage + 1);
        }
      }

      // If we received fewer items than requested, or if search page hit max
      if (res.data.length < (searchParams.limit || 12)) {
        setHasMore(false);
      } else if (isSearch && currentPage + 1 >= res.totalPages) {
        setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={style.newsGrid}>
        {items.length === 0 ? (
          <div className={style.noResults}>
            <SearchX
              aria-hidden="true"
              className={style.noResultsIcon}
              size={48}
            />
            <p>{t('noResults')}</p>
          </div>
        ) : (
          items.map((item, index) => (
            <NewsTile
              key={item.id}
              news={item}
              locale={searchParams.language}
              priority={index < 4}
            />
          ))
        )}
      </div>

      {hasMore && items.length > 0 && (
        <div className={style.loadMoreContainer}>
          <button
            className={style.loadMoreButton}
            onClick={loadMore}
            disabled={loading}
          >
            {loading && (
              <Loader2
                className="animate-spin"
                size={20}
                style={{ marginRight: '8px' }}
              />
            )}
            {t('loadMore') || 'Załaduj więcej'}
          </button>
        </div>
      )}
    </>
  );
}
