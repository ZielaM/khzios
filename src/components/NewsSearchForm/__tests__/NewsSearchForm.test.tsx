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
    render(<NewsSearchForm {...defaultProps} initialQuery="climate change" />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });
    expect(input).toHaveValue('climate change');
  });

  it('debounces the search input and pushes to router after 500ms', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );

    render(<NewsSearchForm {...defaultProps} />);

    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });

    // User types "global warming"
    fireEvent.change(input, { target: { value: 'global warming' } });

    // Right after typing, router.push should not be called yet (debouncing)
    expect(mockPush).not.toHaveBeenCalled();

    // Advance time by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockPush).not.toHaveBeenCalled();

    // Advance time past 500ms total
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now it should be called
    expect(mockPush).toHaveBeenCalledTimes(1);

    // Check if the correct URL with query params is pushed
    // URL will look like: /en/news?query=global+warming&sort=date
    const pushCallArg = mockPush.mock.calls[0][0];
    expect(pushCallArg).toContain('query=global+warming');
  });

  it('does not trigger router.push if the query has not actually changed after trim', () => {
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

    expect(mockPush).not.toHaveBeenCalled();
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

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0];
    // Page 3 should be removed
    expect(pushedUrl).not.toContain('page=3');
    expect(pushedUrl).toContain('query=new+search');
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
  it('displays no options message when searching for non-existent tag', () => {
    render(<NewsSearchForm {...defaultProps} />);
    const comboboxes = screen.getAllByRole('combobox');
    const tagsInput = comboboxes[0];

    fireEvent.change(tagsInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('noResults')).toBeInTheDocument();
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

  it('expands and collapses correctly', () => {
    render(<NewsSearchForm {...defaultProps} />);

    const container = screen.getByTestId('news-search-form');
    expect(container.className).toContain('collapsed');

    const expandButton = screen.getByRole('button', {
      name: 'searchPlaceholder',
    });
    fireEvent.click(expandButton);

    expect(container.className).toContain('expanded');

    // Click on the container when already expanded (covers line 269 false branch)
    fireEvent.click(container);
    expect(container.className).toContain('expanded');

    // Clicking inside the container should not collapse it (covers line 155 false branch)
    const input = screen.getByRole('textbox', { name: 'searchPlaceholder' });
    fireEvent.mouseDown(input);
    expect(container.className).toContain('expanded');

    // Clicking outside collapses it
    fireEvent.mouseDown(document.body);
    expect(container.className).toContain('collapsed');

    // Expand again, then type something
    fireEvent.click(expandButton);
    fireEvent.change(input, { target: { value: 'test query' } });

    // Clicking outside should NOT collapse it when query is present
    fireEvent.mouseDown(document.body);
    expect(container.className).toContain('expanded');
  });

  it('handles date filters', () => {
    render(
      <NewsSearchForm
        {...defaultProps}
        initialDateFrom="2026-01-01"
        initialDateTo="2026-12-31"
      />
    );

    // Expand search form
    const expandButton = screen.getByRole('button', {
      name: 'searchPlaceholder',
    });
    fireEvent.click(expandButton);

    const inputs = screen
      .getAllByRole('textbox')
      .filter(
        (i) => (i as HTMLInputElement).type === 'date'
      ) as HTMLInputElement[];
    if (inputs.length === 0) {
      // Fallback if jsdom doesn't support input[type="date"] mapping to textbox
      const allInputs = document.querySelectorAll('.dateInput');
      expect(allInputs.length).toBe(2);

      fireEvent.change(allInputs[0], { target: { value: '2026-02-01' } });
      fireEvent.focus(allInputs[0]);
      fireEvent.blur(allInputs[0]);

      fireEvent.change(allInputs[1], { target: { value: '2026-11-30' } });
      fireEvent.focus(allInputs[1]);
      fireEvent.blur(allInputs[1]);
    } else {
      expect(inputs[0].value).toBe('2026-01-01');
      expect(inputs[1].value).toBe('2026-12-31');

      fireEvent.change(inputs[0], { target: { value: '2026-02-01' } });
      fireEvent.focus(inputs[0]);
      fireEvent.blur(inputs[0]);

      fireEvent.change(inputs[1], { target: { value: '2026-11-30' } });
      fireEvent.focus(inputs[1]);
      fireEvent.blur(inputs[1]);
    }

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockPush.mock.calls[0][0];
    expect(pushedUrl).toContain('dateFrom=2026-02-01');
    expect(pushedUrl).toContain('dateTo=2026-11-30');
  });
});
