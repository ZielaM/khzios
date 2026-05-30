import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FullTeamPage from '../FullTeamPage';
import type { TeamWithRelations } from '@/lib/team-queries';

// Mock inner components to simplify testing
vi.mock('@/components/AnimateOnce', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-once">{children}</div>
  ),
}));

vi.mock('@/components/TeamHero', () => ({
  default: ({ name }: { name: string }) => (
    <div data-testid="team-hero">{name}</div>
  ),
}));

vi.mock('@/components/TeamMembers', () => ({
  default: () => <div data-testid="team-members" />,
}));

vi.mock('@/components/TeamResearch', () => ({
  default: () => <div data-testid="team-research" />,
}));

vi.mock('@/components/TeamPublications', () => ({
  default: () => <div data-testid="team-publications" />,
}));

vi.mock('@/components/TeamTeaching', () => ({
  default: () => <div data-testid="team-teaching" />,
}));

describe('FullTeamPage', () => {
  it('renders all team sections with translated name', () => {
    const mockTeam = {
      id: '1',
      slug: 'test-team',
      type: 'INTERNAL',
      translations: [{ languageCode: 'en', name: 'Internal Team' }],
      members: [],
      publications: [],
      projects: [],
      courses: [],
    };

    render(
      <FullTeamPage
        team={mockTeam as unknown as TeamWithRelations}
        locale="en"
      />
    );

    expect(screen.getByTestId('team-hero')).toHaveTextContent('Internal Team');
    expect(screen.getByTestId('team-members')).toBeInTheDocument();
    expect(screen.getByTestId('team-research')).toBeInTheDocument();
    expect(screen.getByTestId('team-publications')).toBeInTheDocument();
    expect(screen.getByTestId('team-teaching')).toBeInTheDocument();
  });
});
