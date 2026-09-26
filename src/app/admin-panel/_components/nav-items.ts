import type { NavItem } from './AdminShell';

/** Panel sections; hrefs are relative to the panel address. */
export const NAV_ITEMS: NavItem[] = [
  { href: '', label: 'Pulpit', role: 'EDITOR' },
  { href: '/news', label: 'Aktualności', role: 'EDITOR' },
  { href: '/tags', label: 'Tagi', role: 'EDITOR' },
  { href: '/account', label: 'Moje konto', role: 'EDITOR' },
];
