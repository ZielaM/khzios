import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.tsx'],
    server: {
      deps: {
        // next-intl imports `next/navigation` without an extension, which
        // Node's ESM resolver rejects; let Vite resolve it instead
        inline: ['next-intl'],
      },
    },
    include: ['src/**/*.test.{ts,tsx}'],
    // Everything with logic of its own is measured and must stay at 100%.
    // Pages, layouts and the panel's server actions are not: they tie the
    // framework, the database and the session together and are covered by
    // the e2e suite (e2e/), which runs them against a real server and database.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json', 'html'],
      include: [
        'src/lib/**',
        'src/components/**',
        'src/i18n/**',
        'src/proxy.ts',
        'src/instrumentation.ts',
        'src/app/**/route.ts',
        'src/app/sitemap.ts',
        'src/app/robots.ts',
        // Panel components with behaviour of their own; the rest only lay
        // out fields and are exercised by the panel's e2e tests
        'src/app/admin-panel/_components/{ActionForm,ConfirmButton,FormMessage,LanguageTabs,MoveButtons,SubmitButton,useKeepValuesOnError}.tsx',
        'src/app/admin-panel/_components/useKeepValuesOnError.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.module.scss',
        // Re-exports only
        '**/index.ts',
        // Generated Prisma client and its connection setup
        'src/generated/**',
        'src/lib/prisma.ts',
        // Locale and URL configuration (data, no logic); tests use a stand-in
        'src/i18n/routing.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    css: {
      // CSS modules are mocked — we don't need actual class names in unit tests
      modules: { classNameStrategy: 'non-scoped' },
    },
  },
});
