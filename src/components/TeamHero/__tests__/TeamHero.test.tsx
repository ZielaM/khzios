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
