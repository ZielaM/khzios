import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders only publications tab when projects is empty', () => {
    render(
      <TeamPublications
        publications={mockPublications}
        projects={[]}
        locale="en"
      />
    );

    // "publicationsTab" is the returned value from our next-intl mock
    expect(
      screen.getByRole('button', { name: 'publicationsTab' })
    ).toBeInTheDocument();

    // projects tab shouldn't exist
    expect(
      screen.queryByRole('button', { name: 'projectsTab' })
    ).not.toBeInTheDocument();

    expect(
      screen.getByText('A Study of Mocking in React Tests')
    ).toBeInTheDocument();
    expect(screen.getByText('John Doe, Jane Doe')).toBeInTheDocument();
  });

  it('skips publication and project with empty translations', () => {
    render(
      <TeamPublications
        publications={[
          { ...mockPublications[0], id: 'empty-pub', translations: [] },
        ]}
        projects={[{ ...mockProjects[0], id: 'empty-proj', translations: [] }]}
        locale="en"
      />
    );
    // Neither should throw, and neither title should be rendered
    expect(
      screen.queryByText('A Study of Mocking in React Tests')
    ).not.toBeInTheDocument();

    // Switch to projects tab to trigger the translation check for projects
    fireEvent.click(screen.getByRole('button', { name: 'projectsTab' }));
    expect(screen.queryByText('Advanced AI Project')).not.toBeInTheDocument();
  });

  it('switches to publications tab if projects become empty', () => {
    const { rerender } = render(
      <TeamPublications
        publications={mockPublications}
        projects={mockProjects}
        locale="en"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'projectsTab' }));
    expect(screen.getByText('Advanced AI Project')).toBeVisible();

    rerender(
      <TeamPublications
        publications={mockPublications}
        projects={[]}
        locale="en"
      />
    );
    expect(screen.queryByText('Advanced AI Project')).not.toBeInTheDocument();
    expect(screen.getByText('A Study of Mocking in React Tests')).toBeVisible();
  });

  it('switches to projects tab if publications become empty', () => {
    const { rerender } = render(
      <TeamPublications
        publications={mockPublications}
        projects={mockProjects}
        locale="en"
      />
    );
    expect(screen.getByText('A Study of Mocking in React Tests')).toBeVisible();

    rerender(
      <TeamPublications publications={[]} projects={mockProjects} locale="en" />
    );
    expect(
      screen.queryByText('A Study of Mocking in React Tests')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Advanced AI Project')).toBeVisible();
  });

  it('renders only projects tab when publications is empty', () => {
    render(
      <TeamPublications publications={[]} projects={mockProjects} locale="en" />
    );

    expect(
      screen.getByRole('button', { name: 'projectsTab' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'publicationsTab' })
    ).not.toBeInTheDocument();

    // The project content should be visible
    expect(screen.getByText('Advanced AI Project')).toBeInTheDocument();
    expect(
      screen.getByText('funder: National Science Foundation')
    ).toBeInTheDocument();
  });

  it('renders both tabs and toggles between them', () => {
    render(
      <TeamPublications
        publications={mockPublications}
        projects={mockProjects}
        locale="en"
      />
    );

    const pubTab = screen.getByRole('button', { name: 'publicationsTab' });
    const projTab = screen.getByRole('button', { name: 'projectsTab' });

    expect(pubTab).toBeInTheDocument();
    expect(projTab).toBeInTheDocument();

    // Default active is publications
    expect(screen.getByText('A Study of Mocking in React Tests')).toBeVisible();
    expect(screen.queryByText('Advanced AI Project')).not.toBeInTheDocument();

    // Click projects tab
    fireEvent.click(projTab);

    // Now projects should be visible
    expect(
      screen.queryByText('A Study of Mocking in React Tests')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Advanced AI Project')).toBeVisible();

    // Click publications tab again
    fireEvent.click(pubTab);
    expect(screen.getByText('A Study of Mocking in React Tests')).toBeVisible();
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
