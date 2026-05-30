import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NavItem from '../NavItem';

describe('NavItem', () => {
  it('renders a link with provided label and href', () => {
    render(<NavItem label="News" href="/news" />);
    const link = screen.getByRole('link', { name: 'News' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/news');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<NavItem label="Click Me" href="/" onClick={handleClick} />);
    const link = screen.getByRole('link', { name: 'Click Me' });
    fireEvent.click(link);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
