import { describe, it, expect, vi } from 'vitest';
import { mapWorkingHours } from '../working-hours';
import * as translations from '../translations';

// Mock resolveTranslation to observe its behavior and return controlled outputs
vi.mock('../translations', () => ({
  resolveTranslation: vi.fn(),
}));

describe('mapWorkingHours', () => {
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  it('fills missing days with empty hours and default labels', () => {
    // Only Tuesday is provided in DB
    const dbData = [
      {
        displayOrder: 2,
        translations: [
          { languageCode: 'en', day: 'Tuesday DB', hours: '10:00 - 12:00' },
        ],
      },
    ];

    vi.mocked(translations.resolveTranslation).mockReturnValue({
      translation: {
        languageCode: 'en',
        day: 'Tuesday DB',
        hours: '10:00 - 12:00',
      },
      isFallback: false,
    } as unknown as ReturnType<typeof translations.resolveTranslation>);

    const result = mapWorkingHours(dbData, 'en', dayLabels);

    expect(result).toHaveLength(7);

    // Check missing Monday
    expect(result[0]).toEqual({ day: 'Monday', hours: '' });

    // Check present Tuesday
    expect(result[1]).toEqual({ day: 'Tuesday DB', hours: '10:00 - 12:00' });

    // Check missing Wednesday
    expect(result[2]).toEqual({ day: 'Wednesday', hours: '' });
  });

  it('falls back to default labels when translation is missing or day is empty in DB', () => {
    const dbData = [
      {
        displayOrder: 1,
        translations: [{ languageCode: 'en', day: '', hours: '08:00 - 10:00' }],
      },
      {
        displayOrder: 2,
        // No translation found for this one
        translations: [],
      },
    ];

    vi.mocked(translations.resolveTranslation)
      .mockReturnValueOnce({
        translation: { languageCode: 'en', day: '', hours: '08:00 - 10:00' },
        isFallback: false,
      } as unknown as ReturnType<typeof translations.resolveTranslation>)
      .mockReturnValueOnce({
        translation: undefined,
        isFallback: false,
      } as unknown as ReturnType<typeof translations.resolveTranslation>);

    const result = mapWorkingHours(dbData, 'en', dayLabels);

    // Monday has empty day in DB translation, should fallback to dayLabels.monday
    expect(result[0]).toEqual({ day: 'Monday', hours: '08:00 - 10:00' });

    // Tuesday has no translation returned, should fallback completely
    expect(result[1]).toEqual({ day: 'Tuesday', hours: '' });
  });

  it('trims whitespace from hours and treats whitespace-only as empty', () => {
    const dbData = [
      {
        displayOrder: 1,
        translations: [
          { languageCode: 'en', day: 'Monday', hours: '  09:00 - 15:00  ' },
        ],
      },
      {
        displayOrder: 2,
        translations: [{ languageCode: 'en', day: 'Tuesday', hours: '   ' }], // Whitespace only
      },
    ];

    vi.mocked(translations.resolveTranslation)
      .mockReturnValueOnce({
        translation: {
          languageCode: 'en',
          day: 'Monday',
          hours: '  09:00 - 15:00  ',
        },
        isFallback: false,
      } as unknown as ReturnType<typeof translations.resolveTranslation>)
      .mockReturnValueOnce({
        translation: { languageCode: 'en', day: 'Tuesday', hours: '   ' },
        isFallback: false,
      } as unknown as ReturnType<typeof translations.resolveTranslation>);

    const result = mapWorkingHours(dbData, 'en', dayLabels);

    // Monday should be trimmed
    expect(result[0].hours).toBe('09:00 - 15:00');

    // Tuesday should be empty
    expect(result[1].hours).toBe('');
  });

  it('gracefully handles undefined dbWorkingHours without crashing', () => {
    // Should fallback to default days and empty hours
    // @ts-expect-error testing invalid input
    const result = mapWorkingHours(undefined, 'en', dayLabels);

    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ day: 'Monday', hours: '' });
  });

  it('gracefully handles arbitrary wrong types without crashing', () => {
    // We intentionally pass completely invalid types to test Array.isArray handling
    // @ts-expect-error testing invalid input
    const resultString = mapWorkingHours('not an array', 'en', dayLabels);
    // @ts-expect-error testing invalid input
    const resultObject = mapWorkingHours({ some: 'object' }, 'en', dayLabels);
    // @ts-expect-error testing invalid input
    const resultNumber = mapWorkingHours(12345, 'en', dayLabels);

    // Should safely fallback to default days
    expect(resultString).toHaveLength(7);
    expect(resultObject).toHaveLength(7);
    expect(resultNumber).toHaveLength(7);
  });
});
