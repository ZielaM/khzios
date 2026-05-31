import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer';

vi.mock('next-intl', () => ({
  useTranslations: () => {
    interface TranslationFn {
      (key: string): string;
      rich: (key: string) => string;
    }
    const t = ((key: string) => key) as TranslationFn;
    t.rich = (key: string, values?: Record<string, () => React.ReactNode>) => {
      if (values?.br) values.br();
      return key;
    };
    return t;
  },
  useLocale: () => 'en',
}));

describe('Footer', () => {
  it('renders footer content and links', () => {
    render(<Footer />);

    expect(screen.getByText('brandTitle')).toBeInTheDocument();
    expect(screen.getByText('university')).toBeInTheDocument();
    expect(screen.getByText('contactTitle')).toBeInTheDocument();

    const rssLink = screen.getByRole('link', { name: /RSS/i });
    expect(rssLink).toHaveAttribute('href', '/en/news/feed.xml');

    const phoneInfo = screen.getByText('+48 61 848 72 45');
    expect(phoneInfo).toBeInTheDocument();
  });
});
