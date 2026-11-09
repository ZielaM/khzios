/**
 * Weekly consultation hours: weekdays are numbered 1 = Monday … 7 = Sunday
 * (ISO 8601), times are zero-padded "HH:MM" strings.
 */

export const WEEKDAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Weekday name in the page language, capitalised like a table label. */
export function weekdayName(weekday: number, locale: string): string {
  // 1 January 2024 was a Monday
  const name = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, 0, weekday)));
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** "11:00–13:00" */
export function formatHours(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}
