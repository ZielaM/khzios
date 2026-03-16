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
        <NavItem label="Home" href="/" />

        {/* Dropdown Container */}
        <DropdownMenu label="Services">
          <DropdownItem
            label="Web Development"
            desc="Modern and responsive web applications"
            href="/web-dev"
          />
          <DropdownItem
            label="Mobile Apps"
            desc="iOS and Android native experiences"
            href="/mobile-app"
          />
          <DropdownItem
            label="UI/UX Design"
            desc="Beautiful, user-centered design solutions"
            href="/ui-ux"
          />
        </DropdownMenu>

        <DropdownMenu label="Services">
          <DropdownItem
            label="Web Development"
            desc="Modern and responsive web applications"
            href="/web-dev"
          />
          <DropdownItem
            label="Mobile Apps"
            desc="iOS and Android native experiences"
            href="/mobile-app"
          />
          <DropdownItem
            label="UI/UX Design"
            desc="Beautiful, user-centered design solutions"
            href="/ui-ux"
          />
        </DropdownMenu>

        <NavItem label="About" href="/about" />
        <NavItem label="Contact" href="/contact" />
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
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div
      className={style.dropdownContainer}
      onMouseEnter={() => setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <button className={style.navLink}>
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
      </button>

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
}: {
  label: string;
  desc: string;
  href: string;
}) {
  return (
    <div className={style.dropdownItem}>
      <Link href={href}>
        <h4>{label}</h4>
        <p>{desc}</p>
      </Link>
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
