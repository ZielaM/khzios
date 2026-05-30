import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrcidIcon from '../OrcidIcon';

describe('OrcidIcon', () => {
  it('renders correctly with default size', () => {
    const { container } = render(<OrcidIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('applies custom size and className', () => {
    const { container } = render(
      <OrcidIcon size={32} className="custom-icon" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveClass('custom-icon');
  });
});
