'use client';

import { useState } from 'react';
import Link from 'next/link';
import style from './Navbar.module.scss';
import clsx from 'clsx';

export default function Navbar() {
  return (
    <nav className={style.navbar}>
      <div className={style.navbarContainer}>
        {/* Logo */}
        <Link href="/" className={style.logo}>
          <span className={style.logoAccent}>Next</span>App
        </Link>

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

        {/* CTA */}
        <div className={style.navActions}>
          <button className={style.ctaButton}>Get Started</button>
        </div>
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
