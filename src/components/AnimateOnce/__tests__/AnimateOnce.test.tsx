import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnimateOnce from '../AnimateOnce';

describe('AnimateOnce', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children correctly', () => {
    render(
      <AnimateOnce>
        <span>Test content</span>
      </AnimateOnce>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should apply the className prop to the wrapper div', () => {
    const { container } = render(
      <AnimateOnce className="custom-class">
        <span>Content</span>
      </AnimateOnce>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should add the animate class on mount', () => {
    const { container } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    // CSS modules are mocked with non-scoped strategy, so class name = 'animate'
    expect(container.firstChild).toHaveClass('animate');
  });

  it('should remove the animate class after animationend fires', () => {
    const { container } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('animate');

    // Simulate the animation completing
    fireEvent.animationEnd(wrapper);

    expect(wrapper).not.toHaveClass('animate');
  });

  it('should not have animate class on subsequent renders after animationend', () => {
    const { container, rerender } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.animationEnd(wrapper);

    // Re-render (simulating what happens on WCAG font scale repaint)
    rerender(
      <AnimateOnce>
        <span>Updated content</span>
      </AnimateOnce>
    );

    // The animation class should still be absent — no replay
    expect(wrapper).not.toHaveClass('animate');
  });
});
