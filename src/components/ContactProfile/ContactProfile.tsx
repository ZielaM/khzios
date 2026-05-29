import Image from 'next/image';
import { Mail, Phone, MapPin, Clock, User } from 'lucide-react';
import clsx from 'clsx';
import style from './ContactProfile.module.scss';
import AnimateOnce from '@/components/AnimateOnce';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';

export interface ContactProfileProps {
  name: string;
  title: string;
  email: string;
  phone: string;
  officeLocation: string;
  workingHours: { day: string; hours: string }[];
  photoUrl?: string;
  fallbackIcon?: ReactNode;
}

export default function ContactProfile({
  name,
  title,
  email,
  phone,
  officeLocation,
  workingHours,
  photoUrl,
  fallbackIcon,
}: ContactProfileProps) {
  const tMember = useTranslations('MemberProfile');

  const contactLabel = tMember('contactTitle');
  const emailLabel = tMember('emailLabel');
  const phoneLabel = tMember('phoneLabel');
  const hoursLabel = tMember('hoursLabel');
  const locationLabel = tMember('locationLabel');
  const closedLabel = tMember('closedLabel');

  return (
    <div className={style.container}>
      {/* Hero Card */}
      <AnimateOnce>
        <div className={style.heroCard}>
          <div className={style.avatarContainer}>
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={name}
                fill
                className={style.avatar}
                sizes="150px"
              />
            ) : (
              <div className={style.avatarFallback}>
                {fallbackIcon || <User size={64} />}
              </div>
            )}
          </div>
          <div className={style.heroInfo}>
            {title && <span className={style.heroTitle}>{title}</span>}
            <h1 className={style.heroName}>{name}</h1>
          </div>
        </div>
      </AnimateOnce>

      {/* Info Cards Grid */}
      <AnimateOnce>
        <div className={style.infoGrid}>
          {/* Contact Card */}
          <div className={style.infoCard}>
            <div className={style.cardHeader}>
              <div className={style.cardIcon}>
                <Mail size={20} />
              </div>
              <h2 className={style.cardTitle}>{contactLabel}</h2>
            </div>
            {email || phone ? (
              <ul className={style.contactList}>
                {email && (
                  <li className={style.contactItem}>
                    <div className={style.contactIconWrapper}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className={style.contactLabel}>{emailLabel}</div>
                      <div className={style.contactValue}>
                        <a
                          href={`mailto:${email}`}
                          className={style.contactLink}
                        >
                          {email}
                        </a>
                      </div>
                    </div>
                  </li>
                )}
                {phone && (
                  <li className={style.contactItem}>
                    <div className={style.contactIconWrapper}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <div className={style.contactLabel}>{phoneLabel}</div>
                      <div className={style.contactValue}>
                        <a
                          href={`tel:${phone.replace(/\s/g, '')}`}
                          className={style.contactLink}
                        >
                          {phone}
                        </a>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            ) : (
              <p className={style.noData}>{tMember('noContact')}</p>
            )}
          </div>

          {/* Working Hours Card */}
          <div className={clsx(style.infoCard, style.hoursCard)}>
            <div className={style.cardHeader}>
              <div className={style.cardIcon}>
                <Clock size={20} />
              </div>
              <h2 className={style.cardTitle}>{hoursLabel}</h2>
            </div>
            <ul className={style.hoursList}>
              {workingHours.map((wh, idx) => (
                <li key={idx} className={style.hoursItem}>
                  <span className={style.dayLabel}>{wh.day}</span>
                  <span className={style.hoursValue}>
                    {wh.hours || closedLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Location Card */}
          <div className={style.infoCard}>
            <div className={style.cardHeader}>
              <div className={style.cardIcon}>
                <MapPin size={20} />
              </div>
              <h2 className={style.cardTitle}>{locationLabel}</h2>
            </div>
            <div className={style.locationContent}>
              <p className={style.locationText}>{officeLocation}</p>
            </div>
          </div>
        </div>
      </AnimateOnce>
    </div>
  );
}
