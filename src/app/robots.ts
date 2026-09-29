import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/seo';

// Rendered per request: APP_URL is read at runtime (one Docker image for
// any address), while a static robots.txt would keep the build's default
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
