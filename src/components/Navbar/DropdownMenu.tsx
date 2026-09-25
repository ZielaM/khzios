// DropdownMenu Architecture:
// A fully accessible, responsive dropdown/flyout component.
// On desktop, it acts as a hover-triggered flyout submenu.
// On mobile/compact layouts, it acts as a tap-triggered accordion pushing other content down.
//
// Key tricks:
// - We use `onMouseEnter`/`onMouseLeave` combined with `onFocus`/`onBlur` for full keyboard accessibility.
// - The `contains(e.relatedTarget)` check in onBlur prevents the dropdown from closing immediately
//   when the user tabs from the trigger button into the actual submenu links.

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import clsx from 'clsx';
import navItemStyle from './NavItem.module.scss';
import style from './DropdownMenu.module.scss';
import { useTranslations } from 'next-intl';

/**
 * True when the menu is collapsed behind the hamburger button: on narrow
 * screens, or when WCAG font scaling switched on the compact layout. Must
 * match the `compact-nav` SCSS mixin.
 */
function isCompactNav(): boolean {
  return (
    document.documentElement.classList.contains('compact-layout-sm') ||
    (window.matchMedia?.('(max-width: 768px)').matches ??
      window.innerWidth <= 768)
  );
}

export function DropdownMenu({
  label,
  href,
  children,
}: {
  label: string;
  href: React.ComponentProps<typeof Link>['href'];
  children: React.ReactNode;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const t = useTranslations('Navbar');

  // Prevent default navigation ONLY on mobile to allow the first tap to open the accordion.
  // On desktop, the link still works as a top-level navigational element while hovering reveals children.
  const handleLinkClick = (e: React.MouseEvent) => {
    if (isCompactNav()) {
      e.preventDefault();
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <div
      className={style.dropdownContainer}
      onMouseEnter={() => !isCompactNav() && setIsDropdownOpen(true)}
      onMouseLeave={() => !isCompactNav() && setIsDropdownOpen(false)}
      onFocus={() => !isCompactNav() && setIsDropdownOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsDropdownOpen(false);
        }
      }}
    >
      <Link
        href={href}
        className={navItemStyle.navLink}
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

      {/* Dropdown Menu Container */}
      <div
        className={clsx(style.dropdownMenu, { [style.show]: isDropdownOpen })}
      >
        {/* Mobile-only overview link, since the main trigger on mobile acts as an accordion toggle */}
        <div className={style.mobileOverviewItem}>
          <Link href={href} className={style.overviewLink}>
            {t('seeLabel', { label })}
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

// Sub-component for nested dropdown items, handling its own 3rd-level flyout logic
export function DropdownItem({
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
    if (hasChildren && isCompactNav()) {
      e.preventDefault();
      setIsSubMenuOpen(!isSubMenuOpen);
    }
  };

  return (
    <div
      className={clsx(style.dropdownItem, { [style.hasSubmenu]: hasChildren })}
      /* istanbul ignore next */
      onMouseEnter={() => !isCompactNav() && setIsSubMenuOpen(true)}
      /* istanbul ignore next */
      onMouseLeave={() => !isCompactNav() && setIsSubMenuOpen(false)}
      /* istanbul ignore next */
      onFocus={() => !isCompactNav() && setIsSubMenuOpen(true)}
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
        <span className={style.dropdownItemContent}>
          {/* Not headings: menu entries would pollute the page outline */}
          <span className={style.itemLabel}>{label}</span>
          {desc && <span className={style.itemDesc}>{desc}</span>}
        </span>
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

      {/* Nested Submenu (Level 3) */}
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
