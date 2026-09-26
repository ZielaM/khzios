import { useTranslations } from 'next-intl';
import { Mail, Phone } from 'lucide-react';
import style from './Profile.module.scss';

interface ContactDetailsProps {
  email?: string | null;
  phone?: string | null;
}

/** E-mail and phone as clickable links, or a note when there are none. */
export default function ContactDetails({ email, phone }: ContactDetailsProps) {
  const t = useTranslations('MemberProfile');
  // Guard against malformed records rather than crashing the page
  const safeEmail = typeof email === 'string' ? email.trim() : '';
  const safePhone = typeof phone === 'string' ? phone.trim() : '';

  if (!safeEmail && !safePhone) {
    return <p className={style.noData}>{t('noContact')}</p>;
  }

  return (
    <ul className={style.contactList}>
      {safeEmail && (
        <li className={style.contactItem}>
          <div className={style.contactIconWrapper} aria-hidden="true">
            <Mail size={18} />
          </div>
          <div>
            <div className={style.contactLabel}>{t('emailLabel')}</div>
            <div className={style.contactValue}>
              <a href={`mailto:${safeEmail}`} className={style.contactLink}>
                {safeEmail}
              </a>
            </div>
          </div>
        </li>
      )}
      {safePhone && (
        <li className={style.contactItem}>
          <div className={style.contactIconWrapper} aria-hidden="true">
            <Phone size={18} />
          </div>
          <div>
            <div className={style.contactLabel}>{t('phoneLabel')}</div>
            <div className={style.contactValue}>
              <a
                href={`tel:${safePhone.replace(/\s/g, '')}`}
                className={style.contactLink}
              >
                {safePhone}
              </a>
            </div>
          </div>
        </li>
      )}
    </ul>
  );
}
