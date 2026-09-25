/**
 * Calendar helpers pinned to the department's time zone.
 *
 * Server (UTC in Docker) and browser clocks can disagree about which day it
 * is, so every "today" boundary and every displayed date uses Europe/Warsaw.
 */

export const TIME_ZONE = 'Europe/Warsaw';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Difference between local time in `timeZone` and UTC at `date`, in ms. */
function timeZoneOffset(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second
  );
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Instant of local midnight for the `YYYY-MM-DD` day in `timeZone`. */
function midnight(ymd: string, timeZone: string): Date {
  const utcMidnight = new Date(`${ymd}T00:00:00Z`);
  return new Date(
    utcMidnight.getTime() - timeZoneOffset(utcMidnight, timeZone)
  );
}

function toYmd(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Start of the local calendar day containing `date`. */
export function startOfDay(date: Date = new Date(), timeZone = TIME_ZONE) {
  return midnight(toYmd(date, timeZone), timeZone);
}

/** Start of the local day `days` calendar days after the day of `date`. */
export function startOfDayOffset(
  date: Date,
  days: number,
  timeZone = TIME_ZONE
): Date {
  // Step from local noon so a DST change cannot move us onto the wrong day
  const noon = new Date(startOfDay(date, timeZone).getTime() + DAY_MS / 2);
  return startOfDay(new Date(noon.getTime() + days * DAY_MS), timeZone);
}

/**
 * Parses a `YYYY-MM-DD` value (e.g. from `<input type="date">`) as the start
 * of that local day. Returns undefined for anything else.
 */
export function parseDateInput(
  value: unknown,
  timeZone = TIME_ZONE
): Date | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const date = midnight(value, timeZone);
  // Reject impossible dates such as 2026-02-31, which Date silently rolls over
  return toYmd(date, timeZone) === value ? date : undefined;
}

/** Locale-aware date formatting in the department's time zone. */
export function formatDate(
  date: Date | string,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: TIME_ZONE,
  }).format(new Date(date));
}
