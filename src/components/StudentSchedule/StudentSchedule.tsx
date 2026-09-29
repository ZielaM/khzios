'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { StudentScheduleDto } from '@/lib/student-schedule';
import StudentAnnouncements from './StudentAnnouncements';
import ConsultationsTable from './ConsultationsTable';
import style from './StudentSchedule.module.scss';

type ScheduleState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: StudentScheduleDto };

async function fetchSchedule(): Promise<StudentScheduleDto> {
  const res = await fetch('/api/student-schedule', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Schedule request failed: ${res.status}`);
  return res.json();
}

/**
 * Announcements and consultations, loaded in the browser on every visit.
 * The surrounding page is statically generated and refreshed weekly; fetching
 * this part separately keeps it current without re-rendering the whole page.
 */
export default function StudentSchedule({ locale }: { locale: string }) {
  const t = useTranslations('StudentsPage');
  const [state, setState] = useState<ScheduleState>({ status: 'loading' });

  const load = useCallback(() => {
    fetchSchedule()
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  useEffect(load, [load]);

  // The loaded content moves the sections below; scroll to the linked one
  // again (e.g. /student#consultations from the navbar) once it is in place
  useEffect(() => {
    if (state.status !== 'ready' || !window.location.hash) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
  }, [state.status]);

  const retry = () => {
    setState({ status: 'loading' });
    load();
  };

  return (
    <>
      {state.status === 'ready' ? (
        <StudentAnnouncements
          announcements={state.data.announcements}
          locale={locale}
        />
      ) : (
        // Same id as the loaded section, so #announcements links land here
        <div
          id="announcements"
          className={style.announcementsPlaceholder}
          aria-hidden="true"
        />
      )}

      <section
        id="consultations"
        aria-labelledby="consultations-title"
        aria-busy={state.status === 'loading'}
      >
        <h2 id="consultations-title" className={style.title}>
          {t('consultationsTitle')}
        </h2>

        {state.status === 'loading' && (
          <div className={style.skeleton}>
            <span className={style.visuallyHidden}>{t('scheduleLoading')}</span>
          </div>
        )}

        {state.status === 'error' && (
          <div className={style.error} role="alert">
            <p>{t('scheduleError')}</p>
            <button type="button" onClick={retry} className={style.retry}>
              {t('retry')}
            </button>
          </div>
        )}

        {state.status === 'ready' && (
          <ConsultationsTable
            employees={state.data.consultations}
            locale={locale}
          />
        )}
      </section>

      <noscript>
        <p className={style.error}>{t('scheduleNoScript')}</p>
      </noscript>
    </>
  );
}
