import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamPublications from '../TeamPublications';

// Mock resolveTranslation to bypass complex language fallback logic
vi.mock('@/lib/translations', () => ({
  resolveTranslation: vi.fn((translations) => {
    // Just return the first translation for testing purposes
    return { translation: translations[0] || null, isFallback: false };
  }),
}));

describe('TeamPublications', () => {
  const mockPublications = [
    {
      id: 'pub-1',
      year: 2025,
      authors: 'John Doe, Jane Doe',
      journal: 'Science Journal',
      doi: '10.1234/science',
      displayOrder: 1,
      teamId: 'team-1',
      translations: [
        {
          id: 'pub-tr-1',
          publicationId: 'pub-1',
          languageCode: 'en' as unknown as 'en',
          title: 'A Study of Mocking in React Tests',
        },
      ],
    },
  ];

  const mockProjects = [
    {
      id: 'proj-1',
      years: '2023-2025',
      displayOrder: 1,
      teamId: 'team-1',
      translations: [
        {
          id: 'proj-tr-1',
          projectId: 'proj-1',
          languageCode: 'en' as unknown as 'en',
          title: 'Advanced AI Project',
          funder: 'National Science Foundation',
        },
      ],
    },
  ];

  it('renders nothing when both publications and projects are empty', () => {
    const { container } = render(
      <TeamPublications publications={[]} projects={[]} locale="en" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('gracefully handles undefined and incorrect types without crashing', () => {
    // We intentionally pass undefined, objects, numbers to test defensive programming
    const { container: container1 } = render(
      <TeamPublications
        publications={undefined as never}
        projects={undefined as never}
        locale="en"
      />
    );
    expect(container1).toBeEmptyDOMElement();

    const { container: container2 } = render(
      <TeamPublications
        publications={{} as never}
        projects={'invalid string' as never}
        locale="en"
      />
    );
    expect(container2).toBeEmptyDOMElement();

    const { container: container3 } = render(
      <TeamPublications
        publications={123 as never}
        projects={true as never}
        locale="en"
      />
    );
    expect(container3).toBeEmptyDOMElement();
  });

  it('renders publications and projects as two sections', () => {
    render(
      <TeamPublications
        publications={mockPublications}
        projects={mockProjects}
        locale="en"
      />
    );

    expect(
      screen.getByRole('heading', { level: 2, name: /publicationsTab/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'projectsTab' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('A Study of Mocking in React Tests')
    ).toBeInTheDocument();
    expect(screen.getByText('Advanced AI Project')).toBeInTheDocument();
    expect(screen.getByText(/National Science Foundation/)).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('leaves out a section without entries', () => {
    render(
      <TeamPublications
        publications={mockPublications}
        projects={[]}
        locale="en"
      />
    );

    expect(
      screen.queryByRole('heading', { name: 'projectsTab' })
    ).not.toBeInTheDocument();
  });

  it('skips publication and project with empty translations', () => {
    render(
      <TeamPublications
        publications={[{ ...mockPublications[0], translations: [] }]}
        projects={[{ ...mockProjects[0], translations: [] }]}
        locale="en"
      />
    );

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('formats DOI link correctly', () => {
    const pubWithDoi = [
      {
        ...mockPublications[0],
        doi: '10.5555/test',
      },
      {
        ...mockPublications[0],
        id: 'pub-2',
        doi: 'https://doi.org/10.9999/test',
        translations: [
          {
            ...mockPublications[0].translations[0],
            title: 'Pub 2',
          },
        ],
      },
    ];

    render(
      <TeamPublications publications={pubWithDoi} projects={[]} locale="en" />
    );

    const links = screen.getAllByRole('link', { name: /DOI/ });
    expect(links).toHaveLength(2);

    // The first one had a raw DOI, it should be prefixed
    expect(links[0]).toHaveAttribute('href', 'https://doi.org/10.5555/test');

    // The second one already had https:// prefix
    expect(links[1]).toHaveAttribute('href', 'https://doi.org/10.9999/test');
  });
});
