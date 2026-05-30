import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamMembers from '../TeamMembers';
import { TeamWithRelations } from '@/lib/team-queries';

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
        profileSlug: null,
        translations: [
          {
            employeeId: 'emp2',
            languageCode: 'pl',
            academicTitle: 'mgr inż.',
          },
        ],
      },
    },
  ];

  it('renders nothing when members list is empty', () => {
    const { container } = render(
      <TeamMembers members={[]} locale="pl" teamSlug="test-team" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders academic and technical staff sections correctly', () => {
    render(
      <TeamMembers members={mockMembers} locale="pl" teamSlug="test-team" />
    );

    // Section titles are mocked by next-intl (returns the key)
    expect(screen.getByText('membersTitle')).toBeInTheDocument();
    expect(screen.getByText('academicStaff')).toBeInTheDocument();
    expect(screen.getByText('technicalStaff')).toBeInTheDocument();
  });

  it('renders member cards with correct employee data', () => {
    render(
      <TeamMembers members={mockMembers} locale="pl" teamSlug="test-team" />
    );

    // Assert full name and academic title are rendered
    expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    expect(screen.getByText('prof. dr hab.')).toBeInTheDocument();

    expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    expect(screen.getByText('mgr inż.')).toBeInTheDocument();
  });

  it('renders profile link only if profileSlug is present', () => {
    render(
      <TeamMembers members={mockMembers} locale="pl" teamSlug="test-team" />
    );

    // Jan Kowalski has profileSlug
    const profileLinks = screen.getAllByText(/viewProfile/i);
    expect(profileLinks.length).toBe(1);

    // Check if the link exists
    expect(profileLinks[0].closest('a')).toBeInTheDocument();
  });

  it('renders photo or fallback icon appropriately', () => {
    const { container } = render(
      <TeamMembers members={mockMembers} locale="pl" teamSlug="test-team" />
    );

    // Jan has a photo
    const image = screen.getByAltText('Jan Kowalski');
    expect(image).toHaveAttribute('src', '/photo.jpg');

    // Anna has no photo, she gets fallback icon
    // We cannot easily query by lucide-react icon, but we can query by fallback class
    const fallbacks = container.querySelectorAll('.avatarFallback');
    expect(fallbacks.length).toBe(1);
  });
});
