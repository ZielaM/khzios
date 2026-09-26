import type { ReactNode } from 'react';
import Link from 'next/link';
import type { AdminRole } from '@/generated/prisma/client';
import { hasRole } from '@/lib/admin/session';
import { signOut } from '../_actions/auth';
import NavLink from './NavLink';
import style from './shell.module.scss';

export interface NavItem {
  href: string;
  label: string;
  role: AdminRole;
}

interface AdminShellProps {
  children: ReactNode;
  base: string;
  user: { name: string; role: AdminRole };
  items: NavItem[];
}

export default function AdminShell({
  children,
  base,
  user,
  items,
}: AdminShellProps) {
  return (
    <div className={style.shell}>
      <a href="#admin-main" className="skip-link">
        Przejdź do treści
      </a>
      <header className={style.header}>
        <Link href={base} className={style.brand}>
          Panel KHZiOS
        </Link>
        <div className={style.user}>
          <span>
            {user.name}{' '}
            <span className={style.role}>
              ({user.role === 'ADMIN' ? 'administrator' : 'redaktor'})
            </span>
          </span>
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className={style.headerLink}
          >
            Otwórz stronę
          </a>
          <form action={signOut}>
            <button type="submit" className={style.signOut}>
              Wyloguj
            </button>
          </form>
        </div>
      </header>
      <nav className={style.nav} aria-label="Panel">
        <ul>
          {items
            .filter((item) => hasRole(user.role, item.role))
            .map((item) => (
              <li key={item.href}>
                <NavLink href={`${base}${item.href}`} exact={item.href === ''}>
                  {item.label}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
      <main id="admin-main" className={style.main}>
        {children}
      </main>
    </div>
  );
}
