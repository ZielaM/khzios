export interface SearchPage<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export function emptyPage<T>(page: number): SearchPage<T> {
  return { data: [], total: 0, page, totalPages: 0 };
}
