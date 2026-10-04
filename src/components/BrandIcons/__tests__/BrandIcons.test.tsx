import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FacebookIcon, InstagramIcon } from '../BrandIcons';

describe.each([
  ['FacebookIcon', FacebookIcon, 'path'],
  ['InstagramIcon', InstagramIcon, 'rect'],
])('%s', (_name, Icon, shape) => {
  it('renders a decorative outline icon with the default size', () => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector(shape)).toBeInTheDocument();
  });

  it('applies custom size and className', () => {
    const { container } = render(<Icon size={32} className="custom-icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveClass('custom-icon');
  });
});
