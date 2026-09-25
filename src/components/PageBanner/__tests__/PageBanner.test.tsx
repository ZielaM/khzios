import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageBanner from '../PageBanner';

describe('PageBanner', () => {
  it('renders the photo with its alt text', () => {
    render(
      <PageBanner image={{ src: '/images/student/a.jpg', alt: 'Zajęcia' }} />
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/images/student/a.jpg'
    );
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Zajęcia');
  });

  it('applies the layout class from the parent', () => {
    const { container } = render(
      <PageBanner image={{ src: '/a.jpg', alt: '' }} className="custom" />
    );
    expect(container.firstChild).toHaveClass('custom');
  });
});
