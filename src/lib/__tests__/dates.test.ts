import { describe, it, expect } from 'vitest';
import {
  startOfDay,
  startOfDayOffset,
  parseDateInput,
  formatDate,
} from '../dates';

describe('startOfDay', () => {
  it('returns local midnight in Poland during summer time (UTC+2)', () => {
    expect(startOfDay(new Date('2026-07-15T12:00:00Z')).toISOString()).toBe(
      '2026-07-14T22:00:00.000Z'
    );
  });

  it('returns local midnight in Poland during winter time (UTC+1)', () => {
    expect(startOfDay(new Date('2026-01-15T12:00:00Z')).toISOString()).toBe(
      '2026-01-14T23:00:00.000Z'
    );
  });

  it('uses the Polish calendar day, not the UTC one', () => {
    // 23:30 UTC on 14 July is already 15 July in Poland
    expect(startOfDay(new Date('2026-07-14T23:30:00Z')).toISOString()).toBe(
      '2026-07-14T22:00:00.000Z'
    );
  });
});

describe('startOfDayOffset', () => {
  it('steps whole calendar days across a DST change', () => {
    // Clocks go back on 25 October 2026
    const start = startOfDayOffset(new Date('2026-10-24T10:00:00Z'), 1);
    expect(start.toISOString()).toBe('2026-10-24T22:00:00.000Z');
    const next = startOfDayOffset(new Date('2026-10-24T10:00:00Z'), 2);
    expect(next.toISOString()).toBe('2026-10-25T23:00:00.000Z');
  });

  it('supports negative offsets', () => {
    expect(
      startOfDayOffset(new Date('2026-07-15T12:00:00Z'), -7).toISOString()
    ).toBe('2026-07-07T22:00:00.000Z');
  });
});

describe('parseDateInput', () => {
  it('parses a date input value as local midnight', () => {
    expect(parseDateInput('2026-09-05')?.toISOString()).toBe(
      '2026-09-04T22:00:00.000Z'
    );
  });

  it('rejects malformed and impossible dates', () => {
    expect(parseDateInput('2026-02-31')).toBeUndefined();
    expect(parseDateInput('05.09.2026')).toBeUndefined();
    expect(parseDateInput(42)).toBeUndefined();
    expect(parseDateInput(undefined)).toBeUndefined();
  });
});

describe('formatDate', () => {
  it('formats in the Polish time zone regardless of the host zone', () => {
    // 23:30 UTC is the next day in Poland
    expect(formatDate('2026-07-14T23:30:00Z', 'pl')).toBe('15 lipca 2026');
  });
});
