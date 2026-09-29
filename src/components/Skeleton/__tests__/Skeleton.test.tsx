import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageHeaderSkeleton, SkeletonBlock, SkeletonLines } from '../Skeleton';

describe('loading skeletons', () => {
  it('draw blocks and lines of text', () => {
    const { container } = render(
      <>
        <SkeletonBlock className="photo" />
        <SkeletonLines />
        <SkeletonLines count={5} />
      </>
    );
    expect(container.querySelector('.block.photo')).not.toBeNull();
    const lines = container.querySelectorAll('.lines');
    expect(lines[0].children).toHaveLength(3);
    expect(lines[1].children).toHaveLength(5);
  });

  it('mirror the page header and stay hidden from screen readers', () => {
    const { container, rerender } = render(<PageHeaderSkeleton />);
    const header = container.firstElementChild!;
    expect(header).toHaveAttribute('aria-hidden', 'true');
    expect(header.querySelector('.crumbs')).not.toBeNull();
    expect(header.querySelectorAll('.line')).toHaveLength(2);
    expect(header.querySelector('.image')).toBeNull();

    rerender(<PageHeaderSkeleton breadcrumbs={false} lead={false} image />);
    const bare = container.firstElementChild!;
    expect(bare.querySelector('.crumbs')).toBeNull();
    expect(bare.querySelector('.line')).toBeNull();
    expect(bare.querySelector('.withImage .image')).not.toBeNull();
  });
});
