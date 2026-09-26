import type { NavItem } from './AdminShell';

/** Panel sections; hrefs are relative to the panel address. */
export const NAV_ITEMS: NavItem[] = [
  { href: '', label: 'Pulpit', role: 'EDITOR' },
  { href: '/news', label: 'Aktualności', role: 'EDITOR' },
  { href: '/tags', label: 'Tagi', role: 'EDITOR' },
  { href: '/student/announcements', label: 'Ogłoszenia', role: 'EDITOR' },
  { href: '/student/consultations', label: 'Konsultacje', role: 'EDITOR' },
  { href: '/student/documents', label: 'Statuty i sylabusy', role: 'EDITOR' },
  { href: '/account', label: 'Moje konto', role: 'EDITOR' },
];
