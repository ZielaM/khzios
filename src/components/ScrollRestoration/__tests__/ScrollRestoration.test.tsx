import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ScrollRestoration from '../ScrollRestoration';

// mock usePathname to control it across tests
const mockUsePathname = vi.fn(() => '/en/news');

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('ScrollRestoration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUsePathname.mockReturnValue('/en/news');
    window.scrollTo = vi.fn();
  });

  it('should render nothing (null)', () => {
    const { container } = render(<ScrollRestoration />);
    expect(container.innerHTML).toBe('');
  });

  it('should NOT scroll to top on initial mount', () => {
    render(<ScrollRestoration />);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('should scroll to top when pathname changes', () => {
    const { rerender } = render(<ScrollRestoration />);
    expect(window.scrollTo).not.toHaveBeenCalled();

    // Simulate navigation to a different page
    mockUsePathname.mockReturnValue('/en/news/article-1');
    rerender(<ScrollRestoration />);

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('should NOT scroll when pathname stays the same (page refresh)', () => {
    const { rerender } = render(<ScrollRestoration />);

    // Re-render with same pathname (simulating refresh)
    rerender(<ScrollRestoration />);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('should scroll again on a second navigation', () => {
    const { rerender } = render(<ScrollRestoration />);

    // First navigation
    mockUsePathname.mockReturnValue('/en/news/article-1');
    rerender(<ScrollRestoration />);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);

    // Second navigation
    mockUsePathname.mockReturnValue('/en/news/article-2');
    rerender(<ScrollRestoration />);
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });
});
