import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'node_modules/**',
  ]),
  prettier,
  // Enforce structured logger usage — no raw console calls
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // Allow console in the logger module itself and seed scripts
  {
    files: ['src/lib/logger.ts', 'prisma/seed*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]);

export default eslintConfig;
