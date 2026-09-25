import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import StudentAnnouncements from '../StudentAnnouncements';
import type { AnnouncementDto } from '@/lib/student-schedule';

// Noon in Poland on 15 October 2023
const mockDate = new Date('2023-10-15T10:00:00Z');

const announcement = (
  id: string,
  date: string,
  title: string,
  important = false
): AnnouncementDto => ({
  id,
  date,
  important,
  translations: [{ languageCode: 'pl', title, content: `${title} content` }],
});

const announcements = [
  announcement('1', '2023-10-10T10:00:00Z', 'Past Title'),
  // Late evening in Poland (UTC+2) but still "today" there
  announcement('2', '2023-10-15T21:00:00Z', 'Today Title', true),
  announcement('3', '2023-10-20T10:00:00Z', 'Future Title'),
];

describe('StudentAnnouncements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the section with an empty message when there are no announcements', () => {
    render(<StudentAnnouncements announcements={[]} locale="pl" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'announcementsTitle'
    );
    expect(screen.getByText('noAnnouncementsToShow')).toBeInTheDocument();
  });

  it('renders only today and future announcements by default', () => {
    render(<StudentAnnouncements announcements={announcements} locale="pl" />);

    expect(screen.getByText('Today Title')).toBeInTheDocument();
    expect(screen.getByText('Future Title')).toBeInTheDocument();
    expect(screen.queryByText('Past Title')).not.toBeInTheDocument();
  });

  it('shows past announcements when the switch is turned on', () => {
    render(<StudentAnnouncements announcements={announcements} locale="pl" />);

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByText('Past Title')).toBeInTheDocument();
  });

  it('displays the urgent badge for important announcements', () => {
    render(<StudentAnnouncements announcements={announcements} locale="pl" />);
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('formats dates in the Polish time zone', () => {
    render(
      <StudentAnnouncements announcements={[announcements[1]]} locale="pl" />
    );
    // 21:00 UTC on 15 Oct is 23:00 on 15 Oct in Poland, not the 16th
    expect(screen.getByText('15 paź 2023')).toBeInTheDocument();
  });

  it('shows the empty message when every announcement is in the past', () => {
    render(
      <StudentAnnouncements announcements={[announcements[0]]} locale="pl" />
    );
    expect(screen.getByText('noAnnouncementsToShow')).toBeInTheDocument();
  });
});
