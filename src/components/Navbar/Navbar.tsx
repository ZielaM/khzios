'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import Image from 'next/image';
import style from './Navbar.module.scss';
import clsx from 'clsx';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';
import NavItem from './NavItem';
import { DropdownMenu, DropdownItem } from './DropdownMenu';
import SettingsDropdown from './SettingsDropdown';
import WcagControls from './WcagControls';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('Navbar');
  const tWcag = useTranslations('Wcag');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Zamyka menu po przejściu
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className={style.navbar}>
      <div className={style.navbarHeader}>
        {/* Logo */}
        <div className={style.logo}>
          <Link href="/" className={style.logoLink} onClick={closeMobileMenu}>
            <Image src="/logo.png" alt={t('logoAlt')} width={40} height={40} />
            <span className={style.logoText}>
              {t.rich('logoText', { br: () => <br /> })}
            </span>
          </Link>
        </div>

        {/* Hamburger Button */}
        <button
          className={clsx(style.hamburger, {
            [style.active]: isMobileMenuOpen,
          })}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t('toggleMenu')}
        >
          <span className={style.hamburgerLine}></span>
          <span className={style.hamburgerLine}></span>
          <span className={style.hamburgerLine}></span>
        </button>
      </div>

      <div
        className={clsx(style.navMenuContainer, {
          [style.mobileOpen]: isMobileMenuOpen,
        })}
      >
        {/* Links */}
        <div className={style.navLinks}>
          <NavItem label={t('news')} href="/news" onClick={closeMobileMenu} />

          {/* O nas */}
          <DropdownMenu label={t('aboutUs')} href="/about-us">
            {/* Struktura */}
            <DropdownItem
              label={t('structure')}
              desc={t('structureDesc')}
              href="/about-us/structure"
            >
              <DropdownItem
                label={t('headOfDepartment')}
                href="/about-us/structure/head"
              />
              <DropdownItem
                label={t('secretariat')}
                href="/about-us/structure/secretariat"
              />
              <DropdownItem
                label={t('ruminants')}
                href="/about-us/structure/ruminants"
              />
              <DropdownItem
                label={t('poultry')}
                href="/about-us/structure/poultry"
              />
              <DropdownItem
                label={t('swine')}
                href="/about-us/structure/swine"
              />
              <DropdownItem
                label={t('furAnimals')}
                href="/about-us/structure/fur-animals"
              />
              <DropdownItem
                label={t('vetLab')}
                href="/about-us/structure/veterinary"
              />
              <DropdownItem
                label={t('breedingBooks')}
                href="/about-us/structure/zlotnicka-pig-herdbooks"
              />
            </DropdownItem>
            {/* Publikacje */}
            <DropdownItem
              label={t('publications')}
              desc={t('publicationsDesc')}
              href="/about-us/publications"
            />
          </DropdownMenu>

          <NavItem
            label={t('forStudents')}
            href="/student"
            onClick={closeMobileMenu}
          />
          <NavItem
            label={t('contact')}
            href="/contact"
            onClick={closeMobileMenu}
          />
        </div>

        {/* Language & WCAG Controls */}
        <div className={style.navActions}>
          <SettingsDropdown label={tWcag('settingsToggle')}>
            <LanguageSwitcher />
            <WcagControls
              groupLabel={tWcag('groupLabel')}
              decreaseFont={tWcag('decreaseFont')}
              increaseFont={tWcag('increaseFont')}
              toggleContrast={tWcag('toggleContrast')}
            />
          </SettingsDropdown>
        </div>
      </div>
    </nav>
  );
}
