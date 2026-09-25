import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimateOnce from '../AnimateOnce';

describe('AnimateOnce', () => {
  it('renders its children immediately (no JavaScript needed)', () => {
    render(
      <AnimateOnce>
        <p>Treść</p>
      </AnimateOnce>
    );
    expect(screen.getByText('Treść')).toBeVisible();
  });

  it('merges a custom class name', () => {
    const { container } = render(
      <AnimateOnce className="custom">
        <p>Treść</p>
      </AnimateOnce>
    );
    expect(container.firstChild).toHaveClass('wrapper', 'custom');
  });
});
