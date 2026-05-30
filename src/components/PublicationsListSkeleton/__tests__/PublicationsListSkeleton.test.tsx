import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PublicationsListSkeleton from '../PublicationsListSkeleton';

describe('PublicationsListSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PublicationsListSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
