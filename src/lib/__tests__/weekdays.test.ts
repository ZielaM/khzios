import { describe, it, expect } from 'vitest';
import { formatHours, WEEKDAY_NUMBERS, weekdayName } from '../weekdays';

describe('weekdays', () => {
  it('names the weekdays from Monday, capitalised, in the page language', () => {
    expect(WEEKDAY_NUMBERS.map((d) => weekdayName(d, 'pl'))).toEqual([
      'Poniedziałek',
      'Wtorek',
      'Środa',
      'Czwartek',
      'Piątek',
      'Sobota',
      'Niedziela',
    ]);
    expect(weekdayName(2, 'en')).toBe('Tuesday');
    // ICU writes the Ukrainian apostrophe as U+02BC
    expect(weekdayName(5, 'uk')).toBe('Пʼятниця');
    expect(weekdayName(7, 'ru')).toBe('Воскресенье');
  });

  it('joins start and end times with an en dash', () => {
    expect(formatHours('11:00', '13:00')).toBe('11:00–13:00');
  });
});
