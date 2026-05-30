import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RecentNewsSkeleton from '../RecentNewsSkeleton';

describe('RecentNewsSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<RecentNewsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
