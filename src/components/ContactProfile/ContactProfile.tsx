import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Mail, MapPin } from 'lucide-react';
import {
  ContactDetails,
  InfoCard,
  InfoGrid,
  ProfileHero,
} from '@/components/Profile';
import style from './ContactProfile.module.scss';

export interface ContactProfileProps {
  name: string;
  title: string;
  email: string;
  phone: string;
  officeLocation: string;
  workingHours: { day: string; hours: string }[];
  photoUrl?: string;
  fallbackIcon?: ReactNode;
  /** Heading of the hours card; "Working hours" by default */
  hoursTitle?: string;
  /** Shown instead of the list when there are no hours. */
  noHoursLabel?: string;
  headingLevel?: 1 | 2;
}

/** Contact card for the secretariat and the head of department. */
export default function ContactProfile({
  name,
  title,
  email,
  phone,
  officeLocation,
  workingHours,
  photoUrl,
  fallbackIcon,
  hoursTitle,
  noHoursLabel,
  headingLevel,
}: ContactProfileProps) {
  const t = useTranslations('MemberProfile');
  const hours = Array.isArray(workingHours) ? workingHours : [];

  return (
    <div className={style.container}>
      <ProfileHero
        name={name}
        title={title}
        photoUrl={photoUrl}
        fallbackIcon={fallbackIcon}
        headingLevel={headingLevel}
      />

      <InfoGrid>
        <InfoCard icon={<Mail size={20} />} title={t('contactTitle')}>
          <ContactDetails email={email} phone={phone} />
        </InfoCard>

        <InfoCard
          icon={<Clock size={20} />}
          title={hoursTitle || t('hoursLabel')}
          className={style.hoursCard}
        >
          {hours.length === 0 && noHoursLabel ? (
            <p>{noHoursLabel}</p>
          ) : (
            <ul className={style.hoursList}>
              {/* A day can have several consultation slots */}
              {hours.map((wh, i) => (
                <li key={`${wh.day}-${i}`} className={style.hoursItem}>
                  <span className={style.dayLabel}>{wh.day}</span>
                  <span className={style.hoursValue}>
                    {wh.hours || t('closedLabel')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>

        <InfoCard icon={<MapPin size={20} />} title={t('locationLabel')}>
          <div className={style.locationContent}>
            <p className={style.locationText}>{officeLocation}</p>
          </div>
        </InfoCard>
      </InfoGrid>
    </div>
  );
}
