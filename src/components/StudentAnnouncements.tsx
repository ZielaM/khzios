'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { resolveTranslation } from '@/lib/translations';
import style from './StudentAnnouncements.module.scss';
import type {
  StudentAnnouncement,
  StudentAnnouncementTranslation,
} from '@/generated/prisma/client';

type AnnouncementWithTranslations = StudentAnnouncement & {
  translations: StudentAnnouncementTranslation[];
};

interface Props {
  announcements: AnnouncementWithTranslations[];
  locale: string;
}

export default function StudentAnnouncements({ announcements, locale }: Props) {
  const t = useTranslations('StudentsPage');
  const [showPast, setShowPast] = useState(false);

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today

  const filteredAnnouncements = announcements.filter((ann) => {
    const annDate = new Date(ann.date);
    annDate.setHours(0, 0, 0, 0);

    if (showPast) {
      return true; // Show all (past 7 days, future 7 days)
    } else {
      return annDate >= now; // Show only today and future
    }
  });

  if (announcements.length === 0) {
    return null; // Don't show the section if there are no announcements at all
  }

  return (
    <div className={style.container}>
      <div className={style.header}>
        <h2>{t('announcementsTitle')}</h2>
        <label className={style.toggleContainer}>
          <div className={style.toggleSwitch}>
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
            />
            <span className={style.slider}></span>
          </div>
          {t('showPastAnnouncements')}
        </label>
      </div>

      <div className={style.list}>
        {filteredAnnouncements.length === 0 ? (
          <p className={style.empty}>{t('noAnnouncementsToShow')}</p>
        ) : (
          filteredAnnouncements.map((ann) => {
            const { translation } = resolveTranslation(
              ann.translations,
              locale
            );

            if (!translation) return null;

            return (
              <div
                key={ann.id}
                className={`${style.announcement} ${ann.important ? style.important : ''}`}
              >
                <div className={style.announcementHeader}>
                  <h3 className={style.title}>
                    {translation.title}
                    {ann.important && (
                      <span className={style.urgentBadge}>
                        <AlertCircle />
                        {t('urgent')}
                      </span>
                    )}
                  </h3>
                  <span className={style.date}>
                    {dateFormatter.format(new Date(ann.date))}
                  </span>
                </div>
                <p className={style.content}>{translation.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
