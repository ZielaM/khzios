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
});
