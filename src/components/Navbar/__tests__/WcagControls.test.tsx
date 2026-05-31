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

  it('handles window resize events to update compact classes', () => {
    render(
      <WcagControls
        groupLabel="WCAG"
        decreaseFont="A-"
        increaseFont="A+"
        toggleContrast="Contrast"
      />
    );

    // Mock getComputedStyle to return a scale
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = () =>
      ({
        getPropertyValue: (prop: string) =>
          prop === '--wcag-font-scale' ? '2.0' : '',
      }) as unknown as CSSStyleDeclaration;

    // Change width to force compact layout evaluation
    Object.defineProperty(window, 'innerWidth', {
      value: 500, // 500 / 2.0 = 250 effective width -> triggers mobile classes
      configurable: true,
    });

    fireEvent(window, new Event('resize'));

    expect(document.documentElement.classList.contains('compact-layout')).toBe(
      true
    );
    expect(
      document.documentElement.classList.contains('compact-layout-sm')
    ).toBe(true);

    // Cleanup
    window.getComputedStyle = originalGetComputedStyle;
  });

  it('handles invalid font offset in localStorage gracefully', () => {
    localStorage.setItem('wcag-font-offset', 'invalid');
    render(
      <WcagControls
        groupLabel="WCAG"
        decreaseFont="A-"
        increaseFont="A+"
        toggleContrast="Contrast"
      />
    );
    // Since it's invalid, it should fall back to 0 offset, meaning no --wcag-font-scale property
    expect(
      document.documentElement.style.getPropertyValue('--wcag-font-scale')
    ).toBe('');
  });

  it('handles window resize when no font scale is set', () => {
    render(
      <WcagControls
        groupLabel="WCAG"
        decreaseFont="A-"
        increaseFont="A+"
        toggleContrast="Contrast"
      />
    );

    // Change width to force compact layout evaluation
    Object.defineProperty(window, 'innerWidth', {
      value: 500, // 500 / 1.0 = 500 effective width -> triggers mobile classes
      configurable: true,
    });

    fireEvent(window, new Event('resize'));

    expect(document.documentElement.classList.contains('compact-layout')).toBe(
      true
    );
    expect(
      document.documentElement.classList.contains('compact-layout-sm')
    ).toBe(true);
  });
});
