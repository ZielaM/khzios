import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TeamResearch from '../TeamResearch';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('TeamResearch', () => {
  it('returns null if content is missing', () => {
    const { container } = render(<TeamResearch content={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders content securely', () => {
    const maliciousContent =
      '<p>Research stuff <script>alert("xss")</script></p>';
    render(<TeamResearch content={maliciousContent} />);

    expect(screen.getByText('researchTitle')).toBeInTheDocument();

    const content = screen.getByText('Research stuff');
    expect(content).toBeInTheDocument();
    expect(content.innerHTML).not.toContain('<script>');
  });
});
