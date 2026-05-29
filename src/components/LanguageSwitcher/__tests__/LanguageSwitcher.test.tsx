import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';
import { useSearchParams, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';

// Mock routing from next-intl (i18n/routing)
const mockReplace = vi.fn();

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/about-us/structure',
  routing: {
    locales: ['pl', 'en', 'uk'],
  },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'en'),
  useTranslations: () => vi.fn((key) => key),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all available locales', () => {
    render(<LanguageSwitcher />);

    const buttons = screen.getAllByRole('button', { name: 'switchTo' });
    expect(buttons).toHaveLength(3); // pl, en, uk
  });

  it('disables the active locale button and sets aria-current', () => {
    vi.mocked(useLocale).mockReturnValue('en');

    render(<LanguageSwitcher />);

    const enButton = screen.getByText('EN');
    const plButton = screen.getByText('PL');

    expect(enButton).toBeDisabled();
    expect(enButton).toHaveAttribute('aria-current', 'true');

    expect(plButton).not.toBeDisabled();
    expect(plButton).not.toHaveAttribute('aria-current');
  });

  it('preserves search params and dynamic route params when switching locale', () => {
    // Current state: /en/about-us/structure/[id]?query=test&sort=date
    vi.mocked(useLocale).mockReturnValue('en');
    vi.mocked(useParams).mockReturnValue({ id: 'team-123' });
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('query=test&sort=date') as unknown as ReturnType<
        typeof useSearchParams
      >
    );

    render(<LanguageSwitcher />);

    const plButton = screen.getByText('PL');
    fireEvent.click(plButton);

    expect(mockReplace).toHaveBeenCalledTimes(1);

    // Check if router.replace was called with the correct object
    const replaceCallArg = mockReplace.mock.calls[0];

    expect(replaceCallArg[0]).toEqual({
      pathname: '/about-us/structure',
      params: { id: 'team-123' },
      query: { query: 'test', sort: 'date' },
    });

    expect(replaceCallArg[1]).toEqual({ locale: 'pl' });
  });
});
