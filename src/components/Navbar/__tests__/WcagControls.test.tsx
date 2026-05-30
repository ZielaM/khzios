import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import WcagControls from '../WcagControls';

describe('WcagControls', () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
    window.scrollTo = vi.fn();

    // Mock requestAnimationFrame to execute synchronously
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
  });

  it('toggles high contrast mode and saves to localStorage', () => {
    render(
      <WcagControls
        groupLabel="WCAG"
        decreaseFont="A-"
        increaseFont="A+"
        toggleContrast="Contrast"
      />
    );

    const contrastBtn = screen.getByRole('button', { name: 'Contrast' });

    // Enable
    fireEvent.click(contrastBtn);
    expect(
      document.documentElement.classList.contains('wcag-high-contrast')
    ).toBe(true);
    expect(localStorage.getItem('wcag-high-contrast')).toBe('true');

    // Disable
    fireEvent.click(contrastBtn);
    expect(
      document.documentElement.classList.contains('wcag-high-contrast')
    ).toBe(false);
    expect(localStorage.getItem('wcag-high-contrast')).toBe('false');
  });

  it('increases and decreases font size and saves to localStorage', () => {
    render(
      <WcagControls
        groupLabel="WCAG"
        decreaseFont="A-"
        increaseFont="A+"
        toggleContrast="Contrast"
      />
    );

    const increaseBtn = screen.getByRole('button', { name: 'A+' });
    const decreaseBtn = screen.getByRole('button', { name: 'A-' });

    // Increase
    fireEvent.click(increaseBtn);
    expect(
      document.documentElement.style.getPropertyValue('--wcag-font-scale')
    ).toBe('1.1');
    expect(localStorage.getItem('wcag-font-offset')).toBe('1');

    // Decrease
    fireEvent.click(decreaseBtn);
    expect(
      document.documentElement.style.getPropertyValue('--wcag-font-scale')
    ).toBe('');
    expect(localStorage.getItem('wcag-font-offset')).toBe('0');
  });

  it('restores settings from localStorage on mount', () => {
    localStorage.setItem('wcag-high-contrast', 'true');
    localStorage.setItem('wcag-font-offset', '2');

    render(
      <WcagControls
        groupLabel="WCAG"
        decreaseFont="A-"
        increaseFont="A+"
        toggleContrast="Contrast"
      />
    );

    expect(
      document.documentElement.classList.contains('wcag-high-contrast')
    ).toBe(true);
    expect(
      document.documentElement.style.getPropertyValue('--wcag-font-scale')
    ).toBe('1.2');
  });
});
