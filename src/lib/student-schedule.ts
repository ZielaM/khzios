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

export interface ConsultationSlotDto {
  id: string;
  /** ISO timestamp */
  date: string;
  time: string;
  room: string | null;
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
