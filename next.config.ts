import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  compiler: {
    reactRemoveProperties:
      process.env.NODE_ENV === 'production' &&
      process.env.IS_E2E_TESTING !== 'true',
  },
};

export default withNextIntl(nextConfig);
