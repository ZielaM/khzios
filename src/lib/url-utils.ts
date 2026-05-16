export function computeNextSearchParams(
  currentParams: URLSearchParams,
  newQuery: string,
  newTags: string[],
  newSort: string
): URLSearchParams | null {
  const params = new URLSearchParams(currentParams.toString());
  let changed = false;

  // Handle full-text search query diffs
  if (newQuery) {
    if (params.get('query') !== newQuery) {
      params.set('query', newQuery);
      changed = true;
    }
  } else if (params.has('query')) {
    params.delete('query');
    changed = true;
  }

  // Handle tag multi-select diffs
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

  // Logic Rule: Relevance sorting makes no sense if there is no text query.
  // Automatically fallback to 'date' if query is empty.
  const finalSort = newQuery && newSort === 'relevance' ? 'relevance' : 'date';
  if (params.get('sort') !== finalSort) {
    params.set('sort', finalSort);
    changed = true;
  }

  // Resets pagination to page 1 upon any search criteria change.
  if (changed) {
    params.set('page', '1');
    return params;
  }

  return null;
}
