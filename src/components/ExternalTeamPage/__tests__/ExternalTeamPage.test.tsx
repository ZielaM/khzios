import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExternalTeamPage from '../ExternalTeamPage';
import type { TeamWithRelations } from '@/lib/team-queries';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ExternalTeamPage', () => {
  it('renders team title and links correctly', () => {
    const mockTeam = {
      id: '1',
      slug: 'test-team',
      type: 'EXTERNAL',
      translations: [{ languageCode: 'en', name: 'Test Team' }],
      links: [
        {
          id: 'link1',
          url: 'https://example.com',
          icon: 'globe',
          translations: [{ languageCode: 'en', label: 'Website' }],
        },
      ],
    };

    render(
      <ExternalTeamPage
        team={mockTeam as unknown as TeamWithRelations}
        locale="en"
      />
    );

    expect(screen.getByText('Test Team')).toBeInTheDocument();
    expect(screen.getByText('externalRedirect')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Website/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('handles missing translations and unknown icons gracefully', () => {
    const mockTeamEmpty = {
      id: '2',
      slug: 'fallback-slug',
      type: 'EXTERNAL',
      translations: [], // No translation
      links: [
        {
          id: 'link1',
          url: 'https://example.com',
          icon: 'unknown-icon', // Not in ICONS
          translations: [{ languageCode: 'en', label: 'Website' }],
        },
        {
          id: 'link2',
          url: 'https://example.org',
          icon: 'globe',
          translations: [], // No link translation
        },
      ],
    };

    render(
      <ExternalTeamPage
        team={mockTeamEmpty as unknown as TeamWithRelations}
        locale="en"
      />
    );

    // Should fall back to team.slug
    expect(screen.getByText('fallback-slug')).toBeInTheDocument();

    // Link2 should not be rendered because translation is missing
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
  });
});
