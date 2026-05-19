'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Forces scroll-to-top on every route change.
export default function ScrollRestoration() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll to top if the pathname has actually changed
    // since the component was mounted. This prevents jumps on page refresh.
    if (prevPathname.current !== pathname) {
      window.scrollTo(0, 0);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
