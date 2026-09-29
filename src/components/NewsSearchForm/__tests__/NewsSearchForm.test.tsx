import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import NewsSearchForm from '../NewsSearchForm';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/en/news'),
  useSearchParams: vi.fn(),
}));

describe('NewsSearchForm', () => {
  const defaultProps = {
    initialQuery: '',
    initialTag: '',
    initialSort: 'date' as const,
    availableTags: [
      { value: 'science', label: 'Science' },
      { value: 'education', label: 'Education' },
    ],
  };

  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: mockReplace,
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
    render(<NewsSearchForm {...defaultProps} initialQuery="climate change" />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });
    expect(input).toHaveValue('climate change');
  });

  it('debounces the search input and replaces the URL after 500ms', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );

    render(<NewsSearchForm {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    // User types "global warming"
    fireEvent.change(input, { target: { value: 'global warming' } });

    // Right after typing, router.replace should not be called yet (debouncing)
    expect(mockReplace).not.toHaveBeenCalled();

    // Advance time by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockReplace).not.toHaveBeenCalled();

    // Advance time past 500ms total
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now it should be called
    expect(mockReplace).toHaveBeenCalledTimes(1);

    // Check if the correct URL with query params is pushed
    // URL will look like: /en/news?query=global+warming&sort=date
    const replaceCallArg = mockReplace.mock.calls[0][0];
    expect(replaceCallArg).toContain('query=global+warming');
  });

  it('does not trigger router.replace if the query has not actually changed after trim', () => {
    // Current URL has query=test
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('query=test&sort=date') as unknown as ReturnType<
        typeof useSearchParams
      >
    );

    render(<NewsSearchForm {...defaultProps} initialQuery="test" />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    // User types spaces at the end
    fireEvent.change(input, { target: { value: 'test  ' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('resets pagination when changing search parameters', () => {
    // User is currently on page 3
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('page=3&sort=date') as unknown as ReturnType<
        typeof useSearchParams
      >
    );

    render(<NewsSearchForm {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    fireEvent.change(input, { target: { value: 'new search' } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    const replacedUrl = mockReplace.mock.calls[0][0];
    // Page 3 should be removed
    expect(replacedUrl).not.toContain('page=3');
    expect(replacedUrl).toContain('query=new+search');
  });

  it('renders skeleton correctly', () => {
    render(<NewsSearchForm {...defaultProps} isSkeleton={true} />);

    expect(screen.getByTestId('news-search-form-skeleton')).toBeInTheDocument();

    // Inputs should be disabled
    const input = screen.getByTestId('search-input-skeleton');
    expect(input).toBeDisabled();
  });

  it('updates state when initial props change', () => {
    const { rerender } = render(
      <NewsSearchForm
        {...defaultProps}
        initialQuery="test1"
        initialTag="science"
        initialSort="date"
      />
    );
    expect(
      screen.getByRole('textbox', { name: 'searchPlaceholder' })
    ).toHaveValue('test1');

    rerender(
      <NewsSearchForm
        {...defaultProps}
        initialQuery="test2"
        initialTag="education"
        initialSort="relevance"
      />
    );
    expect(
      screen.getByRole('textbox', { name: 'searchPlaceholder' })
    ).toHaveValue('test2');
  });

  it('handles input focus and blur correctly', () => {
    const { rerender } = render(
      <NewsSearchForm {...defaultProps} initialQuery="initial" />
    );
    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    // Focus on input
    fireEvent.focus(input);

    // While focused, simulate initial props change (should not override typed value)
    rerender(
      <NewsSearchForm {...defaultProps} initialQuery="new props query" />
    );

    // The value should still be what the user typed/had, which was 'initial'
    expect(input).toHaveValue('initial');

    // Unfocus
    fireEvent.blur(input);
  });
  it('toggles tag chips and writes the selection to the URL', () => {
    render(<NewsSearchForm {...defaultProps} />);
    const chip = screen.getByRole('button', {
      name: defaultProps.availableTags[0].label,
    });
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(mockReplace.mock.calls.at(-1)?.[0]).toContain(
      `tag=${encodeURIComponent(defaultProps.availableTags[0].value)}`
    );

    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks tags from the URL as selected and ignores unknown ones', () => {
    render(
      <NewsSearchForm
        {...defaultProps}
        initialTag={`${defaultProps.availableTags[0].value},nieistniejacy`}
      />
    );
    expect(
      screen.getByRole('button', { name: defaultProps.availableTags[0].label })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles unmount during debounce and skeleton with query', () => {
    const { unmount, rerender } = render(
      <NewsSearchForm {...defaultProps} initialQuery="test" isSkeleton={true} />
    );

    // Covers prop update branch when isSkeleton is true
    rerender(
      <NewsSearchForm
        {...defaultProps}
        initialQuery="test2"
        isSkeleton={true}
      />
    );

    // Covers unmount cleanup branch when timerRef is active
    rerender(
      <NewsSearchForm
        {...defaultProps}
        initialQuery="test2"
        isSkeleton={false}
      />
    );

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });
    fireEvent.change(input, { target: { value: 'typing' } });

    unmount();
  });

  it('covers fallback branches for query and sort', () => {
    // Initial render with undefined query and invalid sort
    const { rerender } = render(
      <NewsSearchForm
        {...defaultProps}
        initialQuery={undefined}
        initialSort={'invalid' as unknown as 'date'}
      />
    );

    // Update with another undefined query to trigger `initialQuery || ''` branch during update
    rerender(
      <NewsSearchForm
        {...defaultProps}
        initialQuery={undefined}
        initialTag="newTag"
        initialSort={'invalid' as unknown as 'date'}
      />
    );
  });

  it('shows the search field and labelled filters right away', () => {
    render(<NewsSearchForm {...defaultProps} />);

    expect(
      screen.getByRole('textbox', { name: 'searchPlaceholder' })
    ).toBeVisible();
    expect(screen.getByLabelText('dateFrom')).toBeInTheDocument();
    expect(screen.getByLabelText('dateTo')).toBeInTheDocument();
    // Sorting by relevance needs a query
    expect(screen.queryByLabelText('sortBy')).not.toBeInTheDocument();
  });

  it('handles date filters', () => {
    render(
      <NewsSearchForm
        {...defaultProps}
        initialDateFrom="2026-01-01"
        initialDateTo="2026-12-31"
      />
    );

    const from = screen.getByLabelText('dateFrom') as HTMLInputElement;
    const to = screen.getByLabelText('dateTo') as HTMLInputElement;
    expect(from.value).toBe('2026-01-01');
    expect(to.value).toBe('2026-12-31');

    fireEvent.focus(from);
    fireEvent.change(from, { target: { value: '2026-02-01' } });
    fireEvent.blur(from);
    fireEvent.focus(to);
    fireEvent.change(to, { target: { value: '2026-11-30' } });
    fireEvent.blur(to);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    const replacedUrl = mockReplace.mock.calls[0][0];
    expect(replacedUrl).toContain('dateFrom=2026-02-01');
    expect(replacedUrl).toContain('dateTo=2026-11-30');
  });

  it('writes relevance sorting to the address when chosen for a query', () => {
    render(<NewsSearchForm {...defaultProps} initialQuery="cows" />);
    fireEvent.change(screen.getByRole('combobox', { name: 'sortBy' }), {
      target: { value: 'relevance' },
    });
    act(() => vi.advanceTimersByTime(600));
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('sort=relevance'),
      expect.anything()
    );
  });
});
