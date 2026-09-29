// Menu with submenus: a hover/focus flyout on desktop and a tap-to-open
// accordion in the compact (hamburger) menu. On blur the menu stays open
// while focus moves between its own links (relatedTarget check).

import { useState } from 'react';
import NextLink from 'next/link';
import { useLocale } from 'next-intl';
import { getPathname, Link } from '@/i18n/routing';
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

  // In the compact menu the first tap opens the accordion; on desktop the
  // trigger remains a regular link
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

      <div
        className={clsx(style.dropdownMenu, { [style.show]: isDropdownOpen })}
      >
        {/* In the compact menu the trigger only toggles, so link the page here */}
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

/** Menu entry that can hold its own nested submenu. */
export function DropdownItem({
  label,
  desc,
  href,
  hash,
  children,
}: {
  label: string;
  desc?: string;
  href: React.ComponentProps<typeof Link>['href'];
  /** Section of the page to jump to, e.g. "consultations" */
  hash?: string;
  children?: React.ReactNode;
}) {
  const locale = useLocale();
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
      onMouseEnter={() => !isCompactNav() && setIsSubMenuOpen(true)}
      onMouseLeave={() => !isCompactNav() && setIsSubMenuOpen(false)}
      onFocus={() => !isCompactNav() && setIsSubMenuOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsSubMenuOpen(false);
        }
      }}
    >
      <ItemLink
        href={href}
        hash={hash}
        locale={locale}
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
      </ItemLink>

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

type PathnameHref = Parameters<typeof getPathname>[0]['href'];

/**
 * next-intl's Link drops the `hash` of an href, so anchors are built from
 * the localized path (e.g. /pl/dla-studenta#consultations) with Next's Link.
 */
function ItemLink({
  href,
  hash,
  locale,
  ...props
}: React.ComponentProps<typeof Link> & { hash?: string; locale: string }) {
  if (!hash) return <Link href={href} {...props} />;
  return (
    <NextLink
      href={`${getPathname({ href: href as PathnameHref, locale })}#${hash}`}
      {...props}
    />
  );
}
