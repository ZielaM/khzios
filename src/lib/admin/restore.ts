import { restoreNews, type NewsSnapshot } from './news-admin';
import { restoreEmployee, type EmployeeSnapshot } from './people-admin';
import {
  restoreAnnouncement,
  restoreConsultation,
  restoreDocument,
  type AnnouncementSnapshot,
  type ConsultationSnapshot,
  type DocumentSnapshot,
} from './student-admin';
import {
  restorePublication,
  restoreTeam,
  type PublicationSnapshot,
  type TeamSnapshot,
} from './team-admin';

/** How each kind of trashed item is recreated, with its name in the panel. */
export const TRASH_ENTITIES: Record<
  string,
  { label: string; restore: (data: never) => Promise<void> }
> = {
  news: { label: 'Aktualność', restore: (d: NewsSnapshot) => restoreNews(d) },
  announcement: {
    label: 'Ogłoszenie',
    restore: (d: AnnouncementSnapshot) => restoreAnnouncement(d),
  },
  consultation: {
    label: 'Konsultacje',
    restore: (d: ConsultationSnapshot) => restoreConsultation(d),
  },
  document: {
    label: 'Statut i sylabus',
    restore: (d: DocumentSnapshot) => restoreDocument(d),
  },
  employee: {
    label: 'Pracownik',
    restore: (d: EmployeeSnapshot) => restoreEmployee(d),
  },
  team: { label: 'Zespół', restore: (d: TeamSnapshot) => restoreTeam(d) },
  publication: {
    label: 'Publikacja',
    restore: (d: PublicationSnapshot) => restorePublication(d),
  },
};
