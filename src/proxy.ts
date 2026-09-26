import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { ADMIN_INTERNAL_PATH, getAdminPath } from './lib/env';

const intlMiddleware = createMiddleware(routing);

const isWithin = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The panel's internal route answers only through ADMIN_PATH. Rewriting to
  // a path that is not a locale gives the site's ordinary 404.
  if (isWithin(pathname, ADMIN_INTERNAL_PATH)) {
    return NextResponse.rewrite(new URL('/not-found', request.url));
  }

  const adminPath = getAdminPath();
  if (adminPath && isWithin(pathname, `/${adminPath}`)) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_INTERNAL_PATH + pathname.slice(adminPath.length + 1);
    const response = NextResponse.rewrite(url);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    // Links followed from the panel must not carry its address
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  return intlMiddleware(request);
}

// Every page path, so that e.g. /aktualnosci redirects to /pl/aktualnosci and
// unknown paths get the translated 404. Skips API routes, Next.js internals
// and anything with a file extension (images, sitemap.xml, robots.txt).
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
