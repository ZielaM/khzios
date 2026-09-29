import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PlainNotFound from '../PlainNotFound';

describe('PlainNotFound', () => {
  it('says the page is missing in Polish and English and links home', () => {
    render(<PlainNotFound />);
    expect(
      screen.getByRole('heading', { level: 1, name: '404' })
    ).toBeInTheDocument();
    expect(screen.getByText('Nie znaleziono strony.')).toBeInTheDocument();
    expect(screen.getByText('Page not found.')).toHaveAttribute('lang', 'en');
    expect(
      screen.getByRole('link', { name: 'Strona główna / Home' })
    ).toHaveAttribute('href', '/');
  });
});
