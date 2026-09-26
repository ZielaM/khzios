import type { LanguageCode } from '@/generated/prisma/client';

/** Content languages, Polish first (required), with names for the panel. */
export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'pl', label: 'Polski' },
  { code: 'en', label: 'Angielski' },
  { code: 'uk', label: 'Ukraiński' },
  { code: 'ru', label: 'Rosyjski' },
];
