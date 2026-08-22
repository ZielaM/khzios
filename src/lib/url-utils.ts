export function computeNextSearchParams(
  currentParams: URLSearchParams,
  newQuery: string,
  newTags: string[],
  newSort: string,
  newDateFrom?: string,
  newDateTo?: string
): URLSearchParams | null {
  const params = new URLSearchParams(currentParams.toString());
  let changed = false;

  const currentQuery = params.get('query') || '';
  const trimmedQuery = newQuery.trim();
  if (trimmedQuery !== currentQuery) {
    if (trimmedQuery) params.set('query', trimmedQuery);
    else params.delete('query');
    changed = true;
  }

  const currentTag = params.get('tag') || '';
  const tagsString = newTags.join(',');
  if (tagsString !== currentTag) {
    if (tagsString) params.set('tag', tagsString);
    else params.delete('tag');
    changed = true;
  }

  const finalSort =
    trimmedQuery && newSort === 'relevance' ? 'relevance' : 'date';
  const currentSort = params.get('sort') || 'date';
  if (finalSort !== currentSort) {
    if (finalSort === 'date') params.delete('sort');
    else params.set('sort', finalSort);
    changed = true;
  }

  const currentDateFrom = params.get('dateFrom') || '';
  const cleanDateFrom = newDateFrom?.trim() || '';
  if (cleanDateFrom !== currentDateFrom) {
    if (cleanDateFrom) params.set('dateFrom', cleanDateFrom);
    else params.delete('dateFrom');
    changed = true;
  }

  const currentDateTo = params.get('dateTo') || '';
  const cleanDateTo = newDateTo?.trim() || '';
  if (cleanDateTo !== currentDateTo) {
    if (cleanDateTo) params.set('dateTo', cleanDateTo);
    else params.delete('dateTo');
    changed = true;
  }

  if (changed) {
    params.delete('page');
    return params;
  }

  return null;
}
