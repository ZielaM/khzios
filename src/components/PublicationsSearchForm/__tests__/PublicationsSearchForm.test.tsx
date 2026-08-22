import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PublicationsSearchForm from '../PublicationsSearchForm';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/en/about-us/publications'),
  useSearchParams: vi.fn(),
}));

describe('PublicationsSearchForm', () => {
  const defaultProps = {
    initialQuery: '',
  };

  const mockPush = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders with initial values from props', () => {
    render(
      <PublicationsSearchForm {...defaultProps} initialQuery="test query" />
    );
    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });
    expect(input).toHaveValue('test query');
  });

  it('debounces the search input and pushes to router after 500ms', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );

    render(<PublicationsSearchForm {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    fireEvent.change(input, { target: { value: 'climate publication' } });

    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);

    const pushCallArg = mockPush.mock.calls[0][0];
    expect(pushCallArg).toContain('query=climate+publication');
  });

  it('resets pagination when changing search parameters', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('page=2') as unknown as ReturnType<
        typeof useSearchParams
      >
    );

    render(<PublicationsSearchForm {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    fireEvent.change(input, { target: { value: 'biology' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0];
    // Page 2 should be removed
    expect(pushedUrl).not.toContain('page=2');
    expect(pushedUrl).toContain('query=biology');
  });

  it('deletes query param if search is empty', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('query=old+search') as unknown as ReturnType<
        typeof useSearchParams
      >
    );

    render(
      <PublicationsSearchForm {...defaultProps} initialQuery="old search" />
    );

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    fireEvent.change(input, { target: { value: '' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0];
    expect(pushedUrl).not.toContain('query=old+search');
    expect(pushedUrl).not.toContain('query=');
  });

  it('renders skeleton correctly', () => {
    render(<PublicationsSearchForm {...defaultProps} isSkeleton={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    // Skeleton shouldn't have aria-label since placeholder handles it differently in skeleton mode
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('updates query state when initialQuery prop changes', () => {
    const { rerender } = render(
      <PublicationsSearchForm {...defaultProps} initialQuery="test1" />
    );
    expect(screen.getByRole('textbox')).toHaveValue('test1');

    rerender(<PublicationsSearchForm {...defaultProps} initialQuery="test2" />);
    expect(screen.getByRole('textbox')).toHaveValue('test2');
  });

  it('handles input focus and blur correctly', () => {
    render(<PublicationsSearchForm {...defaultProps} initialQuery="initial" />);
    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'typing...' } });
    fireEvent.blur(input);
  });

  it('does not push if query is the same as currentQuery', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('query=same') as unknown as ReturnType<
        typeof useSearchParams
      >
    );
    render(<PublicationsSearchForm {...defaultProps} initialQuery="same" />);
    const input = screen.getByRole('textbox');

    // Type something that trims to 'same'
    fireEvent.change(input, { target: { value: 'same ' } });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not update query state when initialQuery prop changes if isSkeleton is true', () => {
    const { rerender } = render(
      <PublicationsSearchForm
        {...defaultProps}
        initialQuery="test1"
        isSkeleton={true}
      />
    );
    expect(screen.getByRole('textbox')).toHaveValue('test1');

    rerender(
      <PublicationsSearchForm
        {...defaultProps}
        initialQuery="test2"
        isSkeleton={true}
      />
    );
    expect(screen.getByRole('textbox')).toHaveValue('test1');
  });

  it('clears timeout on component unmount', () => {
    const { unmount } = render(<PublicationsSearchForm {...defaultProps} />);
    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    fireEvent.change(input, { target: { value: 'cleanup test' } });

    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
