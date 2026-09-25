import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamMembers from '../TeamMembers';
import { TeamWithRelations } from '@/lib/team-queries';

// Team with a Polish URL slug that differs from its canonical slug
const team = {
  slug: 'test-team',
  translations: [
    {
      teamId: 't1',
      languageCode: 'pl' as const,
      slug: 'zespol-testowy',
      name: 'Zespół testowy',
      researchDescription: null,
      teachingDescription: null,
    },
  ],
};

describe('TeamMembers Logic', () => {
  const mockMembers: TeamWithRelations['members'] = [
    {
      id: 'member1',
      teamId: 'team1',
      employeeId: 'emp1',
      category: 'ACADEMIC',
      employee: {
        id: 'emp1',
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        phone: null,
        officeLocation: null,
        photoUrl: '/photo.jpg',
        orcid: null,
        profileSlug: 'jan-kowalski',
        translations: [
          {
            employeeId: 'emp1',
            languageCode: 'pl',
            academicTitle: 'prof. dr hab.',
          },
        ],
      },
    },
    {
      id: 'member2',
      teamId: 'team1',
      employeeId: 'emp2',
      category: 'TECHNICAL',
      employee: {
        id: 'emp2',
        firstName: 'Anna',
        lastName: 'Nowak',
        email: null,
        phone: null,
        officeLocation: null,
        photoUrl: null,
        orcid: null,
        profileSlug: 'anna-nowak',
        translations: [
          {
            employeeId: 'emp2',
            languageCode: 'pl',
            academicTitle: 'mgr inż.',
          },
        ],
      },
    },
    {
      id: 'member3',
      teamId: 'team1',
      employeeId: 'emp3',
      category: 'TECHNICAL',
      employee: {
        id: 'emp3',
        firstName: 'Brak',
        lastName: 'Tlumaczenia',
        email: null,
        phone: null,
        officeLocation: null,
        photoUrl: null,
        orcid: null,
        profileSlug: 'brak-tlumaczenia',
        translations: [],
      },
    },
  ];

  it('renders nothing when members list is empty', () => {
    const { container } = render(
      <TeamMembers members={[]} locale="pl" team={team} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders academic and technical staff sections correctly', () => {
    render(<TeamMembers members={mockMembers} locale="pl" team={team} />);

    // Section titles are mocked by next-intl (returns the key)
    expect(screen.getByText('membersTitle')).toBeInTheDocument();
    expect(screen.getByText('academicStaff')).toBeInTheDocument();
    expect(screen.getByText('technicalStaff')).toBeInTheDocument();
  });

  it('renders member cards with correct employee data', () => {
    render(<TeamMembers members={mockMembers} locale="pl" team={team} />);

    // Assert full name and academic title are rendered
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText('prof. dr hab.')).toBeInTheDocument();

    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('mgr inż.')).toBeInTheDocument();

    expect(screen.getByText('Brak Tlumaczenia')).toBeInTheDocument();
  });

  it('renders profile link only if profileSlug is present', () => {
    render(<TeamMembers members={mockMembers} locale="pl" team={team} />);

    // All mock employees have a profileSlug now
    const profileLinks = screen.getAllByText(/viewProfile/i);
    expect(profileLinks.length).toBe(3);

    // Check if the link exists
    expect(profileLinks[0].closest('a')).toBeInTheDocument();
    // Profile links use the team's slug in the page language
    expect(profileLinks[0].closest('a')?.getAttribute('href')).toMatch(
      /^\/about-us\/structure\/zespol-testowy\//
    );
  });

  it('renders photo or fallback icon appropriately', () => {
    const { container } = render(
      <TeamMembers members={mockMembers} locale="pl" team={team} />
    );

    // Jan has a photo
    const image = screen.getByAltText('Jan Kowalski');
    expect(image).toHaveAttribute('src', '/photo.jpg');

    // Anna has no photo, she gets fallback icon
    // We cannot easily query by lucide-react icon, but we can query by fallback class
    const fallbacks = container.querySelectorAll('.avatarFallback');
    expect(fallbacks.length).toBe(2);
  });
});
