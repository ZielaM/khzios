import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import StudentSchedule from '../StudentSchedule';
import type { StudentScheduleDto } from '@/lib/student-schedule';

const schedule: StudentScheduleDto = {
  announcements: [],
  consultations: [
    {
      id: 'e1',
      firstName: 'Anna',
      lastName: 'Kowalska',
      officeLocation: 'pok. 110',
      translations: [{ languageCode: 'pl', academicTitle: 'dr' }],
      consultations: [
        {
          id: 'c1',
          weekday: 3,
          startTime: '10:00',
          endTime: '12:00',
          room: null,
          translations: [],
        },
      ],
    },
  ],
};

const respond = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 503,
    json: () => Promise.resolve(body),
  } as Response);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StudentSchedule', () => {
  it('shows a loading state, then the fetched consultations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(schedule))
    );
    render(<StudentSchedule locale="pl" />);

    expect(screen.getByText('scheduleLoading')).toBeInTheDocument();

    expect(await screen.findByText('dr Anna Kowalska')).toBeInTheDocument();
    expect(screen.getByText('Środa')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toHaveAttribute('dateTime', '10:00');
    expect(screen.getByText('12:00')).toBeInTheDocument();
    // Falls back to the employee's office when the slot has no room
    expect(screen.getByText('pok. 110')).toBeInTheDocument();
    // No slot has a note, so there is no notes column
    expect(screen.queryByText('consultationNote')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/student-schedule', {
      cache: 'no-store',
    });
  });

  it('shows an error with a working retry button', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => respond({}, false))
      .mockImplementationOnce(() => respond(schedule));
    vi.stubGlobal('fetch', fetchMock);
    render(<StudentSchedule locale="pl" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('scheduleError');

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));

    await waitFor(() =>
      expect(screen.getByText('dr Anna Kowalska')).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows a message when nobody has upcoming consultations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond({ announcements: [], consultations: [] }))
    );
    render(<StudentSchedule locale="pl" />);

    expect(await screen.findByText('noConsultations')).toBeInTheDocument();
  });

  it('scrolls to the linked section once the schedule is in place', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(schedule))
    );
    const scrolled: string[] = [];
    Element.prototype.scrollIntoView = function () {
      scrolled.push(this.id);
    };
    window.location.hash = '#consultations';
    render(<StudentSchedule locale="pl" />);
    await screen.findByText('dr Anna Kowalska');
    expect(scrolled).toEqual(['consultations']);
    window.location.hash = '';
  });

  it('names an employee without an academic title by name only', async () => {
    const untitled = structuredClone(schedule);
    untitled.consultations[0].translations = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(untitled))
    );
    render(<StudentSchedule locale="pl" />);
    expect(await screen.findByText('Anna Kowalska')).toBeInTheDocument();
  });

  it('shows one row per slot and the note in the page language', async () => {
    const twoSlots = structuredClone(schedule);
    twoSlots.consultations[0].consultations.push({
      id: 'c2',
      weekday: 5,
      startTime: '08:00',
      endTime: '09:00',
      room: 'pok. 4B',
      translations: [
        { languageCode: 'pl', note: 'Po umówieniu' },
        { languageCode: 'en', note: 'By appointment' },
      ],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => respond(twoSlots))
    );
    render(<StudentSchedule locale="en" />);

    expect(await screen.findAllByText('dr Anna Kowalska')).toHaveLength(2);
    expect(screen.getByText('Friday')).toBeInTheDocument();
    expect(screen.getByText('pok. 4B')).toBeInTheDocument();
    expect(screen.getByText('consultationNote')).toBeInTheDocument();
    expect(screen.getByText('By appointment')).toBeInTheDocument();
  });
});
