import type { ReactNode } from 'react';
import { requireUser } from '@/lib/admin/session';
import { adminHref } from '@/lib/admin/paths';
import AdminShell from '../_components/AdminShell';
import { NAV_ITEMS } from '../_components/nav-items';

/** Panel sections: signed-in users only (each page checks again). */
export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  return (
    <AdminShell
      base={adminHref()}
      user={{ name: user.name, role: user.role }}
      items={NAV_ITEMS}
    >
      {children}
    </AdminShell>
  );
}
