'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { resolveTranslation } from '@/lib/translations';
import { formatDate, startOfDay } from '@/lib/dates';
import type { AnnouncementDto } from '@/lib/student-schedule';
import style from './StudentAnnouncements.module.scss';

interface StudentAnnouncementsProps {
  announcements: AnnouncementDto[];
  locale: string;
}

export default function StudentAnnouncements({
  announcements,
  locale,
}: StudentAnnouncementsProps) {
  const t = useTranslations('StudentsPage');
  const [showPast, setShowPast] = useState(false);

  // Rendered only in the browser (after the schedule is fetched), so reading
  // the current time here cannot cause a hydration mismatch.
  const today = startOfDay().getTime();
  const visible = showPast
    ? announcements
    : announcements.filter((a) => new Date(a.date).getTime() >= today);

  return (
    <section className={style.container} aria-labelledby="announcements-title">
      <div className={style.header}>
        <h2 id="announcements-title">{t('announcementsTitle')}</h2>
        <label className={style.toggleContainer}>
          <span className={style.toggleSwitch}>
            <input
              type="checkbox"
              role="switch"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
            />
            <span className={style.slider} aria-hidden="true" />
          </span>
          {t('showPastAnnouncements')}
        </label>
      </div>

      <div className={style.list}>
        {visible.length === 0 ? (
          <p className={style.empty}>{t('noAnnouncementsToShow')}</p>
        ) : (
          visible.map((ann) => {
            const { translation } = resolveTranslation(
              ann.translations,
              locale
            );
            if (!translation) return null;

            return (
              <article
                key={ann.id}
                data-testid="announcement"
                className={clsx(
                  style.announcement,
                  ann.important && style.important
                )}
              >
                <div className={style.announcementHeader}>
                  <h3 className={style.title}>
                    {translation.title}
                    {ann.important && (
                      <span className={style.urgentBadge}>
                        <AlertCircle aria-hidden="true" />
                        {t('urgent')}
                      </span>
                    )}
                  </h3>
                  <time className={style.date} dateTime={ann.date}>
                    {formatDate(ann.date, locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <p className={style.content}>{translation.content}</p>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
