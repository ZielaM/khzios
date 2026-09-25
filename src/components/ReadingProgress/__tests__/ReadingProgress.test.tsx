import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ReadingProgress from '../ReadingProgress';

function setScroll(scrollY: number, scrollHeight: number, innerHeight = 1000) {
  Object.defineProperty(window, 'scrollY', {
    value: scrollY,
    configurable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: innerHeight,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
}

const fill = (container: HTMLElement) =>
  container.firstElementChild?.firstElementChild as HTMLElement;

describe('ReadingProgress', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<ReadingProgress />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('starts empty and fills as the page scrolls', () => {
    setScroll(0, 3000);
    const { container } = render(<ReadingProgress />);
    expect(fill(container).style.width).toBe('0%');

    setScroll(1000, 3000);
    fireEvent.scroll(window);
    expect(fill(container).style.width).toBe('50%');
  });

  it('ignores pages that cannot scroll', () => {
    setScroll(0, 1000);
    const { container } = render(<ReadingProgress />);
    fireEvent.scroll(window);
    expect(fill(container).style.width).toBe('0%');
  });
});
