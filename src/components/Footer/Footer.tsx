import styles from './Footer.module.scss';
import { Phone, Mail, Rss } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const Footer = () => {
  const t = useTranslations('Footer');
  const locale = useLocale();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Column 1: Address */}
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

        {/* Column 2: Links */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>{t('quickLinks')}</h4>
          <ul className={styles.linksList}>
            <li>
              <a href="#">{t('upPoznan')}</a>
            </li>
            <li>
              <a href="#">{t('facultyLink')}</a>
            </li>
            <li>
              <a href="#">{t('knowledgeBase')}</a>
            </li>
            <li>
              <a href="#">Facebook</a>
            </li>
            <li>
              <a href="#">LinkedIn</a>
            </li>
            <li>
              <a
                href={`/${locale}/news/feed.xml`}
                target="_blank"
                rel="alternate"
                type="application/rss+xml"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--text-secondary)',
                }}
                title="RSS Feed"
              >
                <Rss size={14} /> RSS
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div className={styles.columnWrapper}>
          <div className={styles.column}>
            <h4 className={styles.colTitle}>{t('contactTitle')}</h4>
            <ul className={styles.contactList}>
              <li>
                <Phone className={styles.icon} size={20} />
                <span>+48 61 848 72 45</span>
              </li>
              <li>
                <Mail className={styles.icon} size={20} />
                <span>khz@up.poznan.pl</span>
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
