import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NewsGridSkeleton from '../NewsGridSkeleton';

// Mock NewsTileSkeleton to just render a simple div that we can count
vi.mock('@/components/NewsTile/NewsTileSkeleton', () => ({
  default: () => <div data-testid="news-tile-skeleton" />,
}));

describe('NewsGridSkeleton', () => {
  it('renders exactly 12 skeletons', () => {
    const { getAllByTestId } = render(<NewsGridSkeleton />);
    const skeletons = getAllByTestId('news-tile-skeleton');
    expect(skeletons).toHaveLength(12);
  });
});
