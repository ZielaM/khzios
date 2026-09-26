import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFoundPage from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders correctly', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: /backHome/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
