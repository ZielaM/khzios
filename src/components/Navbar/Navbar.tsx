'use client';

// Navbar Component Architecture:
// This is the primary navigation shell for the application.
// It handles responsive layout switching between a standard desktop bar
// and a full-screen mobile overlay menu. It relies heavily on CSS Modules
// for media queries and class toggling rather than conditional React rendering,
// ensuring the menu is always in the DOM for SEO and immediate accessibility.

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
  // State controlling the mobile slide-down menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('Navbar');
  const tWcag = useTranslations('Wcag');

  // Automatic Menu Closing Logic:
  // Whenever the pathname changes (user clicked a link and navigated successfully),
  // we force the mobile menu to close. A timeout is used to ensure the navigation
  // event loop finishes before ripping the menu out of view.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  // Manual close handler passed down to individual NavItems.
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className={style.navbar}>
      <div className={style.navbarHeader}>
        {/* Logo */}
        <div className={style.logo}>
          <Link
            href="/"
            className={style.logoLink}
            onClick={closeMobileMenu}
            data-testid="logo-link"
          >
            <Image src="/logo.png" alt={t('logoAlt')} width={40} height={40} />
            <span className={style.logoText}>
              {/* .rich allows rendering injected tags like <br /> from translation strings */}
              {t.rich('logoText', { br: () => <br /> })}
            </span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
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

      {/* Main Navigation Container (links + actions) */}
      <div
        className={clsx(style.navMenuContainer, {
          [style.mobileOpen]: isMobileMenuOpen,
        })}
      >
        {/* Links Array */}
        <div className={style.navLinks}>
          <NavItem label={t('news')} href="/news" onClick={closeMobileMenu} />

          {/* Nested Dropdown Menu structure for "About Us" */}
          <DropdownMenu label={t('aboutUs')} href="/about-us">
            {/* Level 1 Submenu */}
            <DropdownItem
              label={t('structure')}
              desc={t('structureDesc')}
              href="/about-us/structure"
            >
              {/* Level 2 Submenus (Flyout on desktop, accordion on mobile) */}
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
            {/* Another Level 1 Item */}
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

        {/* System Actions (Language & Accessibility Settings) */}
        {/* Placed inside SettingsDropdown to save space, but CSS modules 
            extract them inline on larger screens by default. */}
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
