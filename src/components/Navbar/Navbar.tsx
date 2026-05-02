'use client';

import { useState, useEffect } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import Image from 'next/image';
import style from './Navbar.module.scss';
import clsx from 'clsx';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

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
              {t('logoText')}
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
          <NavItem
            label={t('news')}
            href="/aktualnosci"
            onClick={closeMobileMenu}
          />

          {/* O nas */}
          <DropdownMenu label={t('aboutUs')} href="/o-nas" onClick={closeMobileMenu}>
            {/* Struktura */}
            <DropdownItem
              label={t('structure')}
              desc={t('structureDesc')}
              href="/o-nas/struktura"
            >
              <DropdownItem
                label={t('headOfDepartment')}
                href="/o-nas/struktura/kierownik"
              />
              <DropdownItem
                label={t('secretariat')}
                href="/o-nas/struktura/sekretariat"
              />
              <DropdownItem
                label={t('ruminants')}
                href="/o-nas/struktura/przezuwajace"
              />
              <DropdownItem
                label={t('poultry')}
                href="/o-nas/struktura/drob"
              />
              <DropdownItem
                label={t('swine')}
                href="/o-nas/struktura/trzoda"
              />
              <DropdownItem
                label={t('furAnimals')}
                href="/o-nas/struktura/futerkowe"
              />
              <DropdownItem
                label={t('vetLab')}
                href="/o-nas/struktura/weterynaryjna"
              />
              <DropdownItem
                label={t('breedingBooks')}
                href="/o-nas/struktura/ksiegi-zlotnickie"
              />
            </DropdownItem>
            {/* Publikacje */}
            <DropdownItem
              label={t('publications')}
              desc={t('publicationsDesc')}
              href="/o-nas/publikacje"
            />
          </DropdownMenu>

          <NavItem
            label={t('forStudents')}
            href="/student"
            onClick={closeMobileMenu}
          />
          <NavItem label={t('contact')} href="/kontakt" onClick={closeMobileMenu} />
        </div>

        {/* Language & WCAG Controls */}
        <div className={style.navActions}>
          <LanguageSwitcher />
          <WcagControls
            groupLabel={tWcag('groupLabel')}
            decreaseFont={tWcag('decreaseFont')}
            increaseFont={tWcag('increaseFont')}
            toggleContrast={tWcag('toggleContrast')}
          />
        </div>
      </div>
    </nav>
  );
}

function DropdownMenu({
  label,
  href,
  children,
  onClick,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const t = useTranslations('Navbar');

  const handleLinkClick = (e: React.MouseEvent) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      onClick?.();
    }
  };

  return (
    <div
      className={style.dropdownContainer}
      onMouseEnter={() => setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <Link href={href} className={style.navLink} onClick={handleLinkClick}>
        {label}
        <svg
          className={clsx(style.dropdownIcon, { [style.open]: isDropdownOpen })}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Link>

      {/* Dropdown Menu */}
      <div
        className={clsx(style.dropdownMenu, { [style.show]: isDropdownOpen })}
      >
        <div className={style.mobileOverviewItem}>
          <Link href={href} className={style.overviewLink} onClick={onClick}>
            {t('seeLabel', { label })}
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

function DropdownItem({
  label,
  desc,
  href,
  children,
}: {
  label: string;
  desc?: string;
  href: string;
  children?: React.ReactNode;
}) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const t = useTranslations('Navbar');
  const hasChildren = Boolean(children);

  const handleLinkClick = (e: React.MouseEvent) => {
    if (hasChildren && window.innerWidth <= 768) {
      e.preventDefault();
      setIsSubMenuOpen(!isSubMenuOpen);
    }
  };

  return (
    <div
      className={clsx(style.dropdownItem, { [style.hasSubmenu]: hasChildren })}
      onMouseEnter={() => setIsSubMenuOpen(true)}
      onMouseLeave={() => setIsSubMenuOpen(false)}
    >
      <Link
        href={href}
        className={style.dropdownLink}
        onClick={handleLinkClick}
      >
        <div className={style.dropdownItemContent}>
          <h4>{label}</h4>
          <p>{desc}</p>
        </div>
        {hasChildren && (
          <svg
            className={clsx(style.subMenuIcon, { [style.open]: isSubMenuOpen })}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        )}
      </Link>

      {/* Nested Submenu */}
      {hasChildren && (
        <div className={clsx(style.subMenu, { [style.show]: isSubMenuOpen })}>
          <div className={style.mobileOverviewItem}>
            <Link href={href} className={style.overviewLink}>
              {t('seeLabel', { label })}
            </Link>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

function NavItem({
  label,
  href,
  onClick,
}: {
  label: string;
  href: string;
  onClick?: () => void;
}) {
  return (
    <Link href={href} className={style.navLink} onClick={onClick}>
      {label}
    </Link>
  );
}

function WcagControls({
  groupLabel,
  decreaseFont,
  increaseFont,
  toggleContrast,
}: {
  groupLabel: string;
  decreaseFont: string;
  increaseFont: string;
  toggleContrast: string;
}) {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeOffset, setFontSizeOffset] = useState(0);

  const toggleHighContrast = () => {
    setHighContrast((highContrast) => !highContrast);
    if (!highContrast) {
      document.documentElement.classList.add('wcag-high-contrast');
    } else {
      document.documentElement.classList.remove('wcag-high-contrast');
    }
  };

  const changeFontSize = (step: number) => {
    const newOffset = Math.min(Math.max(fontSizeOffset + step, -2), 4);
    setFontSizeOffset(newOffset);
    if (newOffset === 0) {
      document.documentElement.style.fontSize = '';
    } else {
      document.documentElement.style.fontSize = `calc(100% + ${newOffset * 10}%)`;
    }
  };

  return (
    <div
      className={style.wcagControls}
      role="group"
      aria-label={groupLabel}
    >
      <button
        onClick={() => changeFontSize(-1)}
        className={style.wcagButton}
        aria-label={decreaseFont}
        title={decreaseFont}
      >
        <span className={style.wcagTextSmall}>A</span>-
      </button>
      <button
        onClick={() => changeFontSize(1)}
        className={style.wcagButton}
        aria-label={increaseFont}
        title={increaseFont}
      >
        <span className={style.wcagTextLarge}>A</span>+
      </button>
      <button
        onClick={toggleHighContrast}
        className={clsx(style.wcagButton, { [style.active]: highContrast })}
        aria-label={toggleContrast}
        title={toggleContrast}
      >
        <svg
          fill="currentColor"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v16z" />
        </svg>
      </button>
    </div>
  );
}
