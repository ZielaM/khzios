import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/app/globals.scss';
import { getSession } from '@/lib/admin/session';

// Always rendered per request: every page depends on the session
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSession();
  return {
    // No title before sign-in: a 404 under the panel address must look like
    // any other missing page
    title: session?.mfaPassed ? 'Panel KHZiOS' : undefined,
    robots: { index: false, follow: false },
  };
}

// The navigation lives in (panel)/layout.tsx and on the dashboard: this root
// layout is not rendered again after signing in on the same address
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
