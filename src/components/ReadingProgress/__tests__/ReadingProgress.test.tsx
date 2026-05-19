import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadingProgress from '../ReadingProgress';

describe('ReadingProgress', () => {
  it('should render a progressbar element', () => {
    render(<ReadingProgress />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar');

    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-label', 'Reading progress');
  });

  it('should start with 0% progress', () => {
    render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('should contain a progress fill element', () => {
    const { container } = render(<ReadingProgress />);
    const fill = container.querySelector('[class*="progressFill"]');
    expect(fill).toBeInTheDocument();
    expect(fill).toHaveStyle({ width: '0%' });
  });

  it('should update progress on scroll', () => {
    // Mock the DOM dimensions needed for the calculation
    // Total document height: 2000px, Viewport height: 1000px -> Scrollable area: 1000px
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 1000,
      configurable: true,
    });

    const { container } = render(<ReadingProgress />);

    // Simulate scrolling exactly halfway down the page (500px / 1000px scrollable area)
    Object.defineProperty(window, 'scrollY', {
      value: 500,
      configurable: true,
    });
    fireEvent.scroll(window);

    const bar = screen.getByRole('progressbar');
    const fill = container.querySelector('[class*="progressFill"]');

    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(fill).toHaveStyle({ width: '50%' });
  });
});
