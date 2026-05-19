import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ScrollToTop from '../ScrollToTop';

describe('ScrollToTop', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
    // Reset scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('should render a button with aria-label', () => {
    render(<ScrollToTop />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'scrollToTop'
    );
  });

  it('should not have the visible class initially (scrollY = 0)', () => {
    render(<ScrollToTop />);
    const button = screen.getByRole('button');
    expect(button.className).not.toContain('visible');
  });

  it('should become visible after scrolling past 300px', () => {
    render(<ScrollToTop />);

    // Simulate scroll past threshold
    Object.defineProperty(window, 'scrollY', { value: 400 });
    fireEvent.scroll(window);

    const button = screen.getByRole('button');
    expect(button.className).toContain('visible');
  });

  it('should hide again when scrolling back above 300px', () => {
    render(<ScrollToTop />);

    // Scroll down past threshold
    Object.defineProperty(window, 'scrollY', { value: 400 });
    fireEvent.scroll(window);

    // Scroll back up
    Object.defineProperty(window, 'scrollY', { value: 100 });
    fireEvent.scroll(window);

    const button = screen.getByRole('button');
    expect(button.className).not.toContain('visible');
  });

  it('should call window.scrollTo with smooth behavior on click', () => {
    render(<ScrollToTop />);

    fireEvent.click(screen.getByRole('button'));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });
});
