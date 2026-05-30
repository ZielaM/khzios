import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LocationMap from '../LocationMap';

// Mock AnimateOnce to just render children
vi.mock('@/components/AnimateOnce', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('LocationMap', () => {
  it('renders iframe with correct src and title', () => {
    render(<LocationMap />);
    const iframe = screen.getByTitle('Map location');

    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('google.com/maps/embed')
    );
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });
});
