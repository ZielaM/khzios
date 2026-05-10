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
          <DropdownMenu
            label={t('aboutUs')}
            href="/about-us"
            onClick={closeMobileMenu}
          >
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
  href: React.ComponentProps<typeof Link>['href'];
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
      onFocus={() => setIsDropdownOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsDropdownOpen(false);
        }
      }}
    >
      <Link
        href={href}
        className={style.navLink}
        onClick={handleLinkClick}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
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
  href: React.ComponentProps<typeof Link>['href'];
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
      onFocus={() => setIsSubMenuOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsSubMenuOpen(false);
        }
      }}
    >
      <Link
        href={href}
        className={style.dropdownLink}
        onClick={handleLinkClick}
        aria-expanded={hasChildren ? isSubMenuOpen : undefined}
        aria-haspopup={hasChildren ? 'true' : undefined}
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
  href: React.ComponentProps<typeof Link>['href'];
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

  const updateCompactClasses = (scale: number) => {
    const effectiveWidth = window.innerWidth / scale;
    const root = document.documentElement.classList;

    root.toggle('compact-layout', effectiveWidth < 1024);
    root.toggle('compact-layout-sm', effectiveWidth < 768);
  };

  useEffect(() => {
    const savedContrast = localStorage.getItem('wcag-high-contrast') === 'true';
    const savedFontOffset = parseInt(
      localStorage.getItem('wcag-font-offset') || '0',
      10
    );

    if (savedContrast) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighContrast(true);
      document.documentElement.classList.add('wcag-high-contrast');
    }

    const scale = 1 + (!isNaN(savedFontOffset) ? savedFontOffset : 0) * 0.1;

    if (!isNaN(savedFontOffset) && savedFontOffset !== 0) {
      setFontSizeOffset(savedFontOffset);
      document.documentElement.style.setProperty(
        '--wcag-font-scale',
        scale.toString()
      );
    }

    updateCompactClasses(scale);

    const onResize = () => {
      const currentScale = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--wcag-font-scale'
        ) || '1'
      );
      updateCompactClasses(currentScale);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    if (newValue) {
      document.documentElement.classList.add('wcag-high-contrast');
      localStorage.setItem('wcag-high-contrast', 'true');
    } else {
      document.documentElement.classList.remove('wcag-high-contrast');
      localStorage.setItem('wcag-high-contrast', 'false');
    }
  };

  const changeFontSize = (step: number) => {
    const newOffset = Math.min(Math.max(fontSizeOffset + step, 0), 10);
    setFontSizeOffset(newOffset);
    localStorage.setItem('wcag-font-offset', newOffset.toString());

    const scale = 1 + newOffset * 0.1;

    if (newOffset === 0) {
      document.documentElement.style.removeProperty('--wcag-font-scale');
    } else {
      document.documentElement.style.setProperty(
        '--wcag-font-scale',
        scale.toString()
      );
    }

    updateCompactClasses(scale);

    // Force full repaint to prevent Chrome compositor artifacts
    requestAnimationFrame(() => {
      document.body.style.display = 'none';
      void document.body.offsetHeight;
      document.body.style.display = '';
    });
  };

  return (
    <div className={style.wcagControls} role="group" aria-label={groupLabel}>
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
