'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import style from './Navbar.module.scss';
import clsx from 'clsx';

export default function Navbar() {
  return (
    <nav className={style.navbar}>
      {/* Logo */}
      <div className={style.logo}>
        <Link href="/" className={style.logoLink}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <span className={style.logoText}>
            Katedra Hodowli Zwierząt <br /> i Oceny Surowców
          </span>
        </Link>
      </div>

      {/* Links */}
      <div className={style.navLinks}>
        <NavItem label="Aktualności" href="/aktualnosci" />

        {/* O nas */}
        <DropdownMenu label="O nas" href="/o-nas">
          {/* Struktura */}
          <DropdownItem
            label="Struktura katedry"
            desc="Kierownictwo i zespoły pracujące w katedrze"
            href="/o-nas/struktura"
          >
            <DropdownItem
              label="Kierownik katedry"
              href="/o-nas/struktura/kierownik"
            />
            <DropdownItem
              label="Sekretariat katedry"
              href="/o-nas/struktura/sekretariat"
            />
            <DropdownItem
              label="Zespół chowu i hodowli zw. przeżuwających i oceny mleka"
              href="/o-nas/struktura/przezuwajace"
            />
            <DropdownItem
              label="Zespół chowu i hodowli drobiu i ptaków ozdobnych"
              href="/o-nas/struktura/drob"
            />
            <DropdownItem
              label="Zespół chowu i hodowli trzody chlewnej"
              href="/o-nas/struktura/trzoda"
            />
            <DropdownItem
              label="Zespół chowu i hodowli zw. futerkowych, jeleniowatych i oceny mięsa"
              href="/o-nas/struktura/futerkowe"
            />
            <DropdownItem
              label="Pracownia Weterynaryjnej Ochrony Zdrowia Publicznego"
              href="/o-nas/struktura/weterynaryjna"
            />
            <DropdownItem
              label="Zespół ds. prowadzenia ksiąg hod. świń rasy złotnickiej"
              href="/o-nas/struktura/ksiegi-zlotnickie"
            />
          </DropdownItem>
          {/* Publikacje */}
          <DropdownItem
            label="Publikacje"
            desc="Publikacje i badania pracowników katedry"
            href="/o-nas/publikacje"
          />
        </DropdownMenu>

        <NavItem label="Dla studenta" href="/student" />
        <NavItem label="Kontakt" href="/kontakt" />
      </div>

      {/* WCAG Controls */}
      <div className={style.navActions}>
        <WcagControls />
      </div>
    </nav>
  );
}

function DropdownMenu({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div
      className={style.dropdownContainer}
      onMouseEnter={() => setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <Link href={href} className={style.navLink}>
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
  const hasChildren = Boolean(children);

  return (
    <div
      className={clsx(style.dropdownItem, { [style.hasSubmenu]: hasChildren })}
      onMouseEnter={() => setIsSubMenuOpen(true)}
      onMouseLeave={() => setIsSubMenuOpen(false)}
    >
      <Link href={href} className={style.dropdownLink}>
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
          {children}
        </div>
      )}
    </div>
  );
}

function NavItem({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={style.navLink}>
      {label}
    </Link>
  );
}

function WcagControls() {
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
      aria-label="Narzędzia dostępności WCAG"
    >
      <button
        onClick={() => changeFontSize(-1)}
        className={style.wcagButton}
        aria-label="Pomniejsz tekst"
        title="Pomniejsz tekst"
      >
        <span className={style.wcagTextSmall}>A</span>-
      </button>
      <button
        onClick={() => changeFontSize(1)}
        className={style.wcagButton}
        aria-label="Powiększ tekst"
        title="Powiększ tekst"
      >
        <span className={style.wcagTextLarge}>A</span>+
      </button>
      <button
        onClick={toggleHighContrast}
        className={clsx(style.wcagButton, { [style.active]: highContrast })}
        aria-label="Przełącz wysoki kontrast"
        title="Przełącz wysoki kontrast"
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
