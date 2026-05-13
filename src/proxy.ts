import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

// Match all routes except static assets and images
// This pattern routes everything through next-intl for locale detection
export const config = {
  matcher: ['/', '/(pl|en|uk|ru)/:path*'],
};
