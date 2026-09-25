/**
 * `generateStaticParams` for database-backed routes.
 *
 * Returning no params means nothing is prerendered during `next build`, so the
 * production image can be built without database access. Each page is rendered
 * on its first request and then served from the cache, refreshed according to
 * the route's `revalidate` value.
 */
export function renderOnFirstRequest() {
  return [];
}
