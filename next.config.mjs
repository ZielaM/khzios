import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

// Plain ESM rather than next.config.ts: `next start` would otherwise need the
// TypeScript compiler at runtime, which the production image does not ship.
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve modern formats; originals in public/images can stay plain JPG/PNG
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    reactRemoveProperties:
      process.env.NODE_ENV === 'production' &&
      process.env.IS_E2E_TESTING !== 'true',
  },
};

export default withNextIntl(nextConfig);
