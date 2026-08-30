import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import StudentAnnouncements from './StudentAnnouncements';
import { LanguageCode } from '@/generated/prisma/client';

// Create a stable date for tests
const mockDate = new Date('2023-10-15T12:00:00Z');

describe('StudentAnnouncements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseAnnouncements = [
    {
      id: '1',
      date: new Date('2023-10-10T10:00:00Z'), // Past
      important: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: [
        {
          id: '1',
          announcementId: '1',
          languageCode: LanguageCode.pl,
          title: 'Past Title',
          content: 'Past Content',
        },
      ],
    },
    {
      id: '2',
      date: new Date('2023-10-15T10:00:00Z'), // Today
      important: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: [
        {
          id: '2',
          announcementId: '2',
          languageCode: LanguageCode.pl,
          title: 'Today Title',
          content: 'Today Content',
        },
      ],
    },
    {
      id: '3',
      date: new Date('2023-10-20T10:00:00Z'), // Future
      important: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      translations: [
        {
          id: '3',
          announcementId: '3',
          languageCode: LanguageCode.pl,
          title: 'Future Title',
          content: 'Future Content',
        },
      ],
    },
  ];

  it('renders null if there are no announcements', () => {
    const { container } = render(
      <StudentAnnouncements announcements={[]} locale="pl" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders only today and future announcements by default', () => {
    render(
      <StudentAnnouncements announcements={baseAnnouncements} locale="pl" />
    );

    // Header should be rendered (using the translation key returned by the mock)
    expect(screen.getByText('announcementsTitle')).toBeInTheDocument();

    // Only today and future should be visible
    expect(screen.getByText('Today Title')).toBeInTheDocument();
    expect(screen.getByText('Future Title')).toBeInTheDocument();

    // Past should NOT be visible
    expect(screen.queryByText('Past Title')).not.toBeInTheDocument();
  });

  it('shows past announcements when toggle is checked', () => {
    render(
      <StudentAnnouncements announcements={baseAnnouncements} locale="pl" />
    );

    // Initially not present
    expect(screen.queryByText('Past Title')).not.toBeInTheDocument();

    // Find the toggle by checkbox role
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Now past announcement should be visible
    expect(screen.getByText('Past Title')).toBeInTheDocument();
  });

  it('displays the important badge when important is true', () => {
    render(
      <StudentAnnouncements announcements={baseAnnouncements} locale="pl" />
    );

    // The translation mock returns 'urgent' for the translation key
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('displays empty state message when all announcements are filtered out', () => {
    // Pass only a past announcement
    const onlyPast = [baseAnnouncements[0]];
    render(<StudentAnnouncements announcements={onlyPast} locale="pl" />);

    // The title and toggle are visible, but the list should show the empty message
    expect(screen.getByText('noAnnouncementsToShow')).toBeInTheDocument();
  });
});
