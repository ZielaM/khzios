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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**', 'src/components/**'],
      exclude: [
        'src/**/*.test.ts',
        'src/generated/**',
        'src/lib/prisma.ts',
        '**/index.ts',
        '**/*.module.scss',
      ],
    },
    css: {
      // CSS modules are mocked — we don't need actual class names in unit tests
      modules: { classNameStrategy: 'non-scoped' },
    },
  },
});
