import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
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
