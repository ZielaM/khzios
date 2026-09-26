import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

// Every page path, so that e.g. /aktualnosci redirects to /pl/aktualnosci and
// unknown paths get the translated 404. Skips API routes, Next.js internals
// and anything with a file extension (images, sitemap.xml, robots.txt).
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
