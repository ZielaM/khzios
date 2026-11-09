/**
 * Serialisable shape of the student schedule, shared by the API route that
 * produces it and the client component that renders it.
 */

import type { LanguageCode } from '@/types/search-types';

export interface AnnouncementDto {
  id: string;
  /** ISO timestamp */
  date: string;
  important: boolean;
  translations: {
    languageCode: LanguageCode;
    title: string;
    content: string;
  }[];
}

/** A weekly slot: every week on `weekday`, see src/lib/weekdays.ts. */
export interface ConsultationSlotDto {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string | null;
  translations: { languageCode: LanguageCode; note: string }[];
}

export interface EmployeeConsultationsDto {
  id: string;
  firstName: string;
  lastName: string;
  officeLocation: string | null;
  translations: { languageCode: LanguageCode; academicTitle: string | null }[];
  consultations: ConsultationSlotDto[];
}

export interface StudentScheduleDto {
  announcements: AnnouncementDto[];
  consultations: EmployeeConsultationsDto[];
}
