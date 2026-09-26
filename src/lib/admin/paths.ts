import { getAdminPath } from '@/lib/env';

/** Public address of a panel page, e.g. adminHref('/news'). */
export function adminHref(path = '') {
  return `/${getAdminPath()}${path}`;
}
