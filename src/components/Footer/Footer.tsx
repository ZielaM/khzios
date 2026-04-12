import React from 'react';
import styles from './Footer.module.scss';
import { Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Column 1: Address */}
        <div className={styles.column}>
          <h3 className={styles.brandTitle}>
            Katedra Hodowli Zwierząt
            <br />i Oceny Surowców
          </h3>
          <div className={styles.addressInfo}>
            <p>Uniwersytet Przyrodniczy w Poznaniu</p>
            <p>Wydział Hodowli, Bioinżynierii i Ochrony Zwierząt</p>
            <p>ul. Wołyńska 33, 60-637 Poznań</p>
          </div>
        </div>

        {/* Column 2: Links */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>SZYBKIE LINKI</h4>
          <ul className={styles.linksList}>
            <li>
              <a href="#">UP Poznań</a>
            </li>
            <li>
              <a href="#">Wydział Hodowli, Bioinżynierii i Ochrony Zwierząt</a>
            </li>
            <li>
              <a href="#">Baza Wiedzy</a>
            </li>
            <li>
              <a href="#">Facebook</a>
            </li>
            <li>
              <a href="#">LinkedIn</a>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact */}
        <div className={styles.columnWrapper}>
          <div className={styles.column}>
            <h4 className={styles.colTitle}>KONTAKT</h4>
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
            <p>
              © 2026 UNIWERSYTET PRZYRODNICZY W POZNANIU.
              <br />
              KATEDRA HODOWLI ZWIERZĄT I OCENY SUROWCÓW.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
