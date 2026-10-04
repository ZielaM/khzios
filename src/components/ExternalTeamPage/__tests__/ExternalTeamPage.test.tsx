import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExternalTeamPage from '../ExternalTeamPage';
import type { TeamWithRelations } from '@/lib/team-queries';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/BrandIcons', () => ({
  FacebookIcon: () => <svg data-testid="facebook-icon" />,
  InstagramIcon: () => <svg data-testid="instagram-icon" />,
}));

describe('ExternalTeamPage', () => {
  it('renders the notice and links', () => {
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

    expect(screen.getByText('externalRedirect')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Website/i });
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders the brand icon chosen for a link', () => {
    const mockTeam = {
      id: '3',
      slug: 'social-team',
      type: 'EXTERNAL',
      translations: [{ languageCode: 'en', name: 'Social Team' }],
      links: [
        {
          id: 'link1',
          url: 'https://facebook.com/team',
          icon: 'facebook',
          translations: [{ languageCode: 'en', label: 'Facebook' }],
        },
        {
          id: 'link2',
          url: 'https://instagram.com/team',
          icon: 'instagram',
          translations: [{ languageCode: 'en', label: 'Instagram' }],
        },
      ],
    };

    render(
      <ExternalTeamPage
        team={mockTeam as unknown as TeamWithRelations}
        locale="en"
      />
    );

    const facebook = screen.getByRole('link', { name: /Facebook/i });
    expect(within(facebook).getByTestId('facebook-icon')).toBeInTheDocument();

    const instagram = screen.getByRole('link', { name: /Instagram/i });
    expect(within(instagram).getByTestId('instagram-icon')).toBeInTheDocument();
  });

  it('skips untranslated links and falls back to a generic icon', () => {
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

    // Link2 should not be rendered because translation is missing
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
  });
});
