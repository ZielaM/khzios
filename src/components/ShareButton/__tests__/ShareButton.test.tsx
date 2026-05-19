import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from '../ShareButton';

describe('ShareButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset navigator mocks
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  it('should render a share button', () => {
    render(<ShareButton title="Test Article" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have a proper aria-label', () => {
    render(<ShareButton title="Test Article" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'share');
  });

  it('should show "share" text initially', () => {
    render(<ShareButton title="Test Article" />);
    expect(screen.getByText('share')).toBeInTheDocument();
  });

  it('should copy link to clipboard when navigator.share is unavailable', async () => {
    render(<ShareButton title="Test Article" />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        window.location.href
      );
    });
  });

  it('should show "linkCopied" text after copying', async () => {
    render(<ShareButton title="Test Article" />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('linkCopied')).toBeInTheDocument();
    });
  });

  it('should use native share API when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(<ShareButton title="My Article" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'My Article',
        url: window.location.href,
      });
    });
  });

  it('should fall back to clipboard when native share fails', async () => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(new Error('User cancelled')),
      writable: true,
      configurable: true,
    });

    render(<ShareButton title="Test Article" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
