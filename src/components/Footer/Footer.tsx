import styles from './Footer.module.scss';
import { Phone, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { DEPARTMENT_CONTACT } from '@/lib/contact';

const Footer = () => {
  const t = useTranslations('Footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3 className={styles.brandTitle}>
            {t.rich('brandTitle', { br: () => <br /> })}
          </h3>
          <div className={styles.addressInfo}>
            <p>{t('university')}</p>
            <p>{t('faculty')}</p>
            <p>{t('address')}</p>
          </div>
        </div>

        <div className={styles.column}>
          <h4 className={styles.colTitle}>{t('quickLinks')}</h4>
          <ul className={styles.linksList}>
            <li>
              <a href="https://www.up.poznan.pl/">{t('upPoznan')}</a>
            </li>
            <li>
              <a href="https://wwz.up.poznan.pl/">{t('facultyLink')}</a>
            </li>
            <li>
              <Link href="/accessibility">{t('accessibility')}</Link>
            </li>
          </ul>
        </div>

        {/* The wrapper pushes the copyright to the bottom of the column */}
        <div className={styles.columnWrapper}>
          <div className={styles.column}>
            <h4 className={styles.colTitle}>{t('contactTitle')}</h4>
            <ul className={styles.contactList}>
              <li>
                <Phone aria-hidden="true" className={styles.icon} size={20} />
                <span>{DEPARTMENT_CONTACT.phone}</span>
              </li>
              <li>
                <Mail aria-hidden="true" className={styles.icon} size={20} />
                <span>{DEPARTMENT_CONTACT.email}</span>
              </li>
            </ul>
          </div>

          <div className={styles.copyright}>
            <p>{t('copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
