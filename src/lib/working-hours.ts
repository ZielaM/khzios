import { resolveTranslation } from '@/lib/translations';

export function mapWorkingHours<
  T extends { languageCode: unknown; day: string; hours: string },
>(
  dbWorkingHours: { displayOrder: number; translations: T[] }[],
  locale: string,
  dayLabels: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  }
) {
  const defaultDays = [
    { key: 'monday', order: 1 },
    { key: 'tuesday', order: 2 },
    { key: 'wednesday', order: 3 },
    { key: 'thursday', order: 4 },
    { key: 'friday', order: 5 },
    { key: 'saturday', order: 6 },
    { key: 'sunday', order: 7 },
  ] as const;

  const safeWorkingHours = Array.isArray(dbWorkingHours) ? dbWorkingHours : [];

  return defaultDays.map(({ key, order }) => {
    const dbDay = safeWorkingHours.find((wh) => wh.displayOrder === order);

    if (dbDay) {
      const { translation: whTranslation } = resolveTranslation(
        dbDay.translations as unknown as {
          languageCode: string;
          day: string;
          hours: string;
        }[],
        locale
      );
      return {
        day: whTranslation?.day || dayLabels[key],
        hours: whTranslation?.hours?.trim() || '',
      };
    }

    return {
      day: dayLabels[key],
      hours: '',
    };
  });
}
