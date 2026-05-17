import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';

// ─── Mock: next-intl ────────────────────────────────────────────────
// Components use useTranslations() which requires IntlProvider context.
// We mock it to return the translation key itself, so tests can assert
// on stable keys rather than locale-dependent strings.

vi.mock('next-intl', () => ({
  useTranslations: () => {
    // Returns a function that echoes the key (with params appended if any)
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return `${key}:${JSON.stringify(params)}`;
      }
      return key;
    };
    return t;
  },
}));

// ─── Mock: next/navigation ──────────────────────────────────────────
// Client components use useRouter, usePathname, useSearchParams.
// We provide controllable defaults that tests can override via vi.mocked().

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/en/news',
  useSearchParams: () => mockSearchParams,
}));

// ─── Mock: @/i18n/routing ───────────────────────────────────────────
// NewsTile imports { Link } from '@/i18n/routing'.
// We replace it with a simple <a> tag for rendering tests.

vi.mock('@/i18n/routing', () => ({
  Link: ({
    href,
    children,
    ...props
  }: Omit<React.ComponentProps<'a'>, 'href'> & {
    href: string | { pathname?: string; params?: Record<string, string> };
  }) => {
    const hrefString =
      typeof href === 'object'
        ? (href.pathname?.replace('[id]', href.params?.id ?? '') ?? '#')
        : href;
    return (
      <a href={hrefString} {...props}>
        {children}
      </a>
    );
  },
}));

// ─── Mock: next/image ───────────────────────────────────────────────
// Next.js Image component requires server-side optimization config.
// Replace with a plain <img> for unit tests.

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));
