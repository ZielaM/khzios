import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfileHero from '../ProfileHero';

describe('ProfileHero', () => {
  it('shows the photo, title and name as the page heading', () => {
    render(
      <ProfileHero
        name="Anna Kowalska"
        title="dr hab."
        photoUrl="/media/anna-0123456789ab.webp"
      >
        <p>Pokój 110</p>
      </ProfileHero>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Anna Kowalska' })
    ).toBeInTheDocument();
    expect(screen.getByText('dr hab.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Anna Kowalska' })).toHaveAttribute(
      'src',
      '/media/anna-0123456789ab.webp'
    );
    expect(screen.getByText('Pokój 110')).toBeInTheDocument();
  });

  it('uses a placeholder without a photo and can be a second-level heading', () => {
    const { container, rerender } = render(
      <ProfileHero name="Sekretariat" headingLevel={2} />
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Sekretariat' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    // The default icon is decorative
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    rerender(<ProfileHero name="Sekretariat" fallbackIcon={<span>SK</span>} />);
    expect(screen.getByText('SK')).toBeInTheDocument();
  });
});
