import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RelatedNewsSkeleton from '../RelatedNewsSkeleton';

describe('RelatedNewsSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<RelatedNewsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
