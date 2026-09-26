import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NewsGridSkeleton from '../NewsGridSkeleton';

describe('NewsGridSkeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<NewsGridSkeleton />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
