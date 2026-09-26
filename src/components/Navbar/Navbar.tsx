'use client';

// The mobile menu is toggled with CSS classes rather than conditional
// rendering, so every link stays in the HTML for crawlers and no-JS users.

import { useState, useEffect, useRef } from 'react';
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
import type { NavigationTeam } from '@/lib/team-queries';

export default function Navbar({ teams }: { teams: NavigationTeam[] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('Navbar');
  const tWcag = useTranslations('Wcag');

  const prevPathname = useRef(pathname);

  // Close the mobile menu after navigation (but not on the initial render)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      const timeoutId = setTimeout(() => {
        setIsMobileMenuOpen(false);
      }, 0);
      prevPathname.current = pathname;
      return () => clearTimeout(timeoutId);
    }
  }, [pathname]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Escape closes the open mobile menu and returns focus to its toggle
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <nav className={style.navbar} aria-label={t('mainNavLabel')}>
      <div className={style.navbarHeader}>
        <div className={style.logo}>
          <Link
            href="/"
            className={style.logoLink}
            onClick={closeMobileMenu}
            data-testid="logo-link"
          >
            {/* The department name next to the logo is the link text */}
            <Image src="/logo.png" alt="" width={40} height={40} />
            <span className={style.logoText}>
              {/* The translation marks the line break with <br></br> */}
              {t.rich('logoText', { br: () => <br /> })}
            </span>
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className={clsx(style.hamburger, {
            [style.active]: isMobileMenuOpen,
          })}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={t('toggleMenu')}
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-menu"
        >
          <span className={style.hamburgerLine}></span>
          <span className={style.hamburgerLine}></span>
          <span className={style.hamburgerLine}></span>
        </button>
      </div>

      <div
        id="main-menu"
        className={clsx(style.navMenuContainer, {
          [style.mobileOpen]: isMobileMenuOpen,
        })}
      >
        <div className={style.navLinks}>
          <NavItem label={t('news')} href="/news" onClick={closeMobileMenu} />

          <DropdownMenu label={t('aboutUs')} href="/about-us">
            <DropdownItem
              label={t('structure')}
              desc={t('structureDesc')}
              href="/about-us/structure"
            >
              {/* Flyout on desktop, accordion in the compact menu */}
              <DropdownItem
                label={t('headOfDepartment')}
                href="/about-us/structure/head"
              />
              {teams.map((team) => (
                <DropdownItem
                  key={team.slug}
                  label={team.name}
                  href={{
                    pathname: '/about-us/structure/[team]',
                    params: { team: team.slug },
                  }}
                />
              ))}
            </DropdownItem>
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

        {/* Inline on wide screens; behind a toggle in the compact layout */}
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
