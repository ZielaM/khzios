import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BackLink from '../BackLink';

describe('BackLink', () => {
  it('renders a link with children and href', () => {
    render(<BackLink href="/news">Go Back</BackLink>);
    const link = screen.getByRole('link', { name: /Go Back/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/news');
  });

  it('applies custom className', () => {
    render(
      <BackLink href="/news" className="custom-class">
        Back
      </BackLink>
    );
    const link = screen.getByRole('link', { name: /Back/i });
    expect(link).toHaveClass('custom-class');
  });
});
