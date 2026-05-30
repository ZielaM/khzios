import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NewsTileSkeleton from '../NewsTileSkeleton';

describe('NewsTileSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<NewsTileSkeleton />);
    // Check if the skeleton main wrapper is present
    expect(container.firstChild).toBeInTheDocument();
  });
});
