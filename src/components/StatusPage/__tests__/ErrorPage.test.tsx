import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorPage from '../ErrorPage';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

describe('ErrorPage', () => {
  it('retries by refreshing server data and resetting the boundary', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('boom')} reset={reset} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'title' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/ }));

    expect(refresh).toHaveBeenCalled();
    expect(reset).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /backHome/ })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('shows the error digest only when there is one', () => {
    const { rerender } = render(
      <ErrorPage error={new Error('boom')} reset={() => {}} />
    );
    expect(screen.queryByText(/code/)).not.toBeInTheDocument();

    const withDigest = Object.assign(new Error('boom'), { digest: 'abc123' });
    rerender(<ErrorPage error={withDigest} reset={() => {}} />);
    expect(screen.getByText(/code/)).toBeInTheDocument();
  });
});
