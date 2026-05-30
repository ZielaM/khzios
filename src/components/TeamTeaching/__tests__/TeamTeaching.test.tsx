import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TeamTeaching from '../TeamTeaching';
import type { TeamWithRelations } from '@/lib/team-queries';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/AnimateOnce', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-once">{children}</div>
  ),
}));

describe('TeamTeaching', () => {
  it('returns null if no content and no courses', () => {
    const { container } = render(
      <TeamTeaching content={null} courses={[]} locale="en" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders courses table', () => {
    const mockCourses = [
      {
        id: '1',
        translations: [
          {
            languageCode: 'en',
            name: 'Biology 101',
            program: 'BSc',
            coordinator: 'Dr. Smith',
          },
        ],
      },
    ];

    render(
      <TeamTeaching
        content="Teaching intro"
        courses={mockCourses as unknown as TeamWithRelations['courses']}
        locale="en"
      />
    );

    expect(screen.getByText('teachingTitle')).toBeInTheDocument();
    expect(screen.getByText('Teaching intro')).toBeInTheDocument();

    expect(screen.getByText('Biology 101')).toBeInTheDocument();
    expect(screen.getByText('BSc')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
  });
});
