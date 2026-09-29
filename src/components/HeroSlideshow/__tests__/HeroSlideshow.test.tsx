import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import HeroSlideshow from '../HeroSlideshow';

const images = [
  { src: '/images/hero/1.jpg', alt: 'First' },
  { src: '/images/hero/2.jpg', alt: 'Second' },
  { src: '/images/hero/3.jpg', alt: 'Third' },
];

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: reduce } as MediaQueryList)
  );
}

/** Only the visible slide carries its alt text */
const visibleAlt = () =>
  screen
    .getAllByRole('img')
    .map((img) => img.getAttribute('alt'))
    .filter(Boolean);

describe('HeroSlideshow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders nothing without images', () => {
    const { container } = render(<HeroSlideshow images={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows a single image without a pause control', () => {
    render(<HeroSlideshow images={[images[0]]} />);
    expect(visibleAlt()).toEqual(['First']);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('mounts only the current and the next photo up front', () => {
    const { container } = render(<HeroSlideshow images={images} />);
    expect(container.querySelectorAll('img')).toHaveLength(2);
  });

  it('cross-fades to the next photo after the interval and wraps around', () => {
    const { container } = render(
      <HeroSlideshow images={images} intervalMs={1000} />
    );
    expect(visibleAlt()).toEqual(['First']);

    act(() => vi.advanceTimersByTime(1000));
    expect(visibleAlt()).toEqual(['Second']);
    expect(container.querySelectorAll('img')).toHaveLength(3);

    // Each timeout is scheduled after the previous render, so step one by one
    act(() => vi.advanceTimersByTime(1000));
    expect(visibleAlt()).toEqual(['Third']);
    act(() => vi.advanceTimersByTime(1000));
    expect(visibleAlt()).toEqual(['First']);
  });

  it('stops rotating when paused and resumes on play', () => {
    render(<HeroSlideshow images={images} intervalMs={1000} />);

    fireEvent.click(screen.getByRole('button', { name: 'pause' }));
    act(() => vi.advanceTimersByTime(5000));
    expect(visibleAlt()).toEqual(['First']);

    fireEvent.click(screen.getByRole('button', { name: 'play' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(visibleAlt()).toEqual(['Second']);
  });

  it('starts paused for users who prefer reduced motion', () => {
    mockReducedMotion(true);
    render(<HeroSlideshow images={images} intervalMs={1000} />);

    act(() => vi.advanceTimersByTime(5000));
    expect(visibleAlt()).toEqual(['First']);
    expect(screen.getByRole('button', { name: 'play' })).toBeInTheDocument();
  });

  it('rotates in browsers without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    render(<HeroSlideshow images={images} />);
    act(() => vi.advanceTimersByTime(8000));
    expect(visibleAlt()).toEqual(['Second']);
  });

  it('renders on the server as rotating, before motion preferences are known', () => {
    const html = renderToString(<HeroSlideshow images={images} />);
    expect(html).toContain('/images/hero/1.jpg');
    expect(html).toContain('aria-label="pause"');
  });
});
