import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AnimateOnce from '../AnimateOnce';

// Mock IntersectionObserver
let observerCallback: IntersectionObserverCallback;
let observerInstance: IntersectionObserver;
let mockDisconnect: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockDisconnect = vi.fn();

  class MockIntersectionObserver implements IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];
    observe = vi.fn() as unknown as (target: Element) => void;
    unobserve = vi.fn() as unknown as (target: Element) => void;
    disconnect = mockDisconnect as unknown as () => void;
    takeRecords = vi.fn(
      () => []
    ) as unknown as () => IntersectionObserverEntry[];

    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
      observerInstance = this as unknown as IntersectionObserver;
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper to simulate an intersection
function simulateIntersection(isIntersecting: boolean) {
  act(() => {
    observerCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      observerInstance
    );
  });
}

describe('AnimateOnce', () => {
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

  it('should start hidden (wrapper class, no animate)', () => {
    const { container } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    expect(container.firstChild).toHaveClass('wrapper');
    expect(container.firstChild).not.toHaveClass('animate');
  });

  it('should add the animate class when element enters viewport', () => {
    const { container } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    simulateIntersection(true);

    expect(container.firstChild).toHaveClass('animate');
  });

  it('should not add animate class when element is not intersecting', () => {
    const { container } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    simulateIntersection(false);

    expect(container.firstChild).not.toHaveClass('animate');
  });

  it('should disconnect observer after first intersection', () => {
    render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    simulateIntersection(true);

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should remove animate class and add visible class after animationend', () => {
    const { container } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    simulateIntersection(true);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('animate');

    fireEvent.animationEnd(wrapper);

    expect(wrapper).not.toHaveClass('animate');
    expect(wrapper).toHaveClass('visible');
  });

  it('should stay visible after animationend and rerender (WCAG repaint)', () => {
    const { container, rerender } = render(
      <AnimateOnce>
        <span>Content</span>
      </AnimateOnce>
    );

    simulateIntersection(true);

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.animationEnd(wrapper);

    rerender(
      <AnimateOnce>
        <span>Updated content</span>
      </AnimateOnce>
    );

    expect(wrapper).not.toHaveClass('animate');
    expect(wrapper).toHaveClass('visible');
  });
});
