import { revalidatePath } from 'next/cache';

/**
 * Regenerates every public page on its next visit. The site is small, so
 * refreshing everything after an edit is simpler and safer than tracking
 * which pages show which record (a team name appears in the menu, the
 * structure page, member profiles and the home page, for instance).
 *
 * Pages also keep `revalidate = 86400`: a daily refresh picks up what no
 * edit triggers (the footer year, five-year publication windows, rows
 * changed directly in the database) at the cost of one render a day.
 */
export function revalidatePublicSite() {
  revalidatePath('/[locale]', 'layout');
  revalidatePath('/sitemap.xml');
}
