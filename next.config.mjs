import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const isDev = process.env.NODE_ENV !== 'production';

// Next.js injects inline scripts for hydration and the layout has an inline
// script applying WCAG preferences before paint. A nonce-based policy would
// force every page to render per request (no ISR), so inline scripts are
// allowed and the policy instead restricts where content may load from.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  // react-select (Emotion) and next/image insert inline styles
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  // Google Maps on the contact page, loaded only after the visitor asks
  'frame-src https://www.google.com',
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

// Plain ESM rather than next.config.ts: `next start` would otherwise need the
// TypeScript compiler at runtime, which the production image does not ship.
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    // WebP only: AVIF files are a little smaller but take ~10x longer to
    // encode on first request (0.8–1.8 s per size vs ~0.1 s), and under load
    // some AVIF encodes stalled. Originals in public/images can stay JPG/PNG.
    formats: ['image/webp'],
  },
  experimental: {
    // Photo and PDF uploads in the admin panel (limits are checked again
    // in lib/admin/storage.ts); uploads pass through the proxy as well
    serverActions: { bodySizeLimit: '25mb' },
    proxyClientMaxBodySize: '25mb',
  },
  compiler: {
    reactRemoveProperties:
      process.env.NODE_ENV === 'production' &&
      process.env.IS_E2E_TESTING !== 'true',
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
