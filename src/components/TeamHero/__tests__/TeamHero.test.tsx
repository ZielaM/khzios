import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TeamHero from '../TeamHero';

describe('TeamHero', () => {
  it('renders team name securely', () => {
    const maliciousName = 'Test Team <script>alert("xss")</script>';
    render(<TeamHero name={maliciousName} />);

    // DOMPurify should remove the script tag
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Test Team');
    expect(heading.innerHTML).not.toContain('<script>');
  });
});

describe('TeamHero banner', () => {
  it('renders without a photo when none is provided', () => {
    render(<TeamHero name="Zespół" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the team photo behind the title', () => {
    render(
      <TeamHero
        name="Zespół"
        image={{ src: '/images/teams/ruminants/a.jpg', alt: 'Obora' }}
      />
    );
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Obora');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Zespół'
    );
  });
});
