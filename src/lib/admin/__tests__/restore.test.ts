import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { newsSnapshot, restoreNews, type NewsSnapshot } from '../news-admin';
import {
  announcementSnapshot,
  consultationSnapshot,
  documentSnapshot,
  restoreAnnouncement,
  restoreConsultation,
  restoreDocument,
  type ConsultationSnapshot,
} from '../student-admin';
import {
  employeeSnapshot,
  restoreEmployee,
  weeklyHoursFrom,
  type EmployeeSnapshot,
} from '../people-admin';
import {
  publicationSnapshot,
  restorePublication,
  restoreTeam,
  teamSnapshot,
  type PublicationSnapshot,
  type TeamSnapshot,
} from '../team-admin';
import { TRASH_ENTITIES } from '../restore';

vi.mock('@/lib/prisma', () => {
  const model = () => ({
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn((args) => args),
    updateMany: vi.fn((args) => args),
  });
  return {
    prisma: {
      news: model(),
      tag: model(),
      studentAnnouncement: model(),
      consultation: model(),
      studentDocument: model(),
      employee: model(),
      team: model(),
      publication: model(),
      $transaction: vi.fn(),
    },
  };
});

const created = (m: { create: unknown }) =>
  vi.mocked(m.create as (a: unknown) => unknown).mock.calls[0][0] as {
    data: Record<string, unknown>;
  };

beforeEach(() => vi.clearAllMocks());

describe('snapshots', () => {
  it('capture the relations each restore needs', async () => {
    const tx = {
      news: { findUnique: vi.fn() },
      studentAnnouncement: { findUnique: vi.fn() },
      consultation: { findUnique: vi.fn() },
      studentDocument: { findUnique: vi.fn() },
      employee: { findUnique: vi.fn() },
      team: { findUnique: vi.fn() },
      publication: { findUnique: vi.fn() },
    };
    const t = tx as never;
    await newsSnapshot(t, 'n');
    await announcementSnapshot(t, 'a');
    await consultationSnapshot(t, 'c');
    await documentSnapshot(t, 'd');
    await employeeSnapshot(t, 'e');
    await teamSnapshot(t, 't');
    await publicationSnapshot(t, 'p');

    const include = (m: { findUnique: ReturnType<typeof vi.fn> }) =>
      Object.keys(m.findUnique.mock.calls[0][0].include ?? {});
    expect(include(tx.news)).toEqual(['translations', 'tags', 'photos']);
    expect(include(tx.studentAnnouncement)).toEqual(['translations']);
    expect(include(tx.consultation)).toEqual([]);
    expect(include(tx.studentDocument)).toEqual(['translations']);
    expect(include(tx.employee)).toEqual([
      'translations',
      'teamMembers',
      'consultations',
    ]);
    expect(include(tx.team)).toEqual([
      'translations',
      'members',
      'publications',
      'projects',
      'courses',
      'links',
    ]);
    expect(include(tx.publication)).toEqual(['translations']);
  });
});

describe('restoreNews', () => {
  it('recreates the article with its photos and only the tags that still exist', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValue([{ id: 'kept' }] as never);
    const snapshot = {
      id: 'n1',
      createdAt: '2026-01-01T00:00:00.000Z',
      published: true,
      publishedAt: '2026-01-02T00:00:00.000Z',
      translations: [
        { newsId: 'n1', languageCode: 'pl', title: 'T', content: '<p>C</p>' },
      ],
      tags: [{ id: 'kept' }, { id: 'deleted' }],
      photos: [
        {
          id: 'p1',
          newsId: 'n1',
          url: '/media/a.webp',
          displayOrder: 0,
          translations: [{ photoId: 'p1', languageCode: 'pl', alt: 'Opis' }],
        },
      ],
    } as unknown as NewsSnapshot;
    await restoreNews(snapshot);

    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['kept', 'deleted'] } },
      select: { id: true },
    });
    expect(created(prisma.news).data).toEqual({
      id: 'n1',
      createdAt: '2026-01-01T00:00:00.000Z',
      published: true,
      publishedAt: '2026-01-02T00:00:00.000Z',
      translations: {
        create: [{ languageCode: 'pl', title: 'T', content: '<p>C</p>' }],
      },
      tags: { connect: [{ id: 'kept' }] },
      photos: {
        create: [
          {
            id: 'p1',
            url: '/media/a.webp',
            displayOrder: 0,
            translations: { create: [{ languageCode: 'pl', alt: 'Opis' }] },
          },
        ],
      },
    });
  });
});

describe('student zone', () => {
  it('restores an announcement and a document with their translations', async () => {
    await restoreAnnouncement({
      id: 'a1',
      date: 'd',
      important: true,
      createdAt: 'c',
      translations: [
        { announcementId: 'a1', languageCode: 'pl', title: 'T', content: 'C' },
      ],
    } as never);
    expect(created(prisma.studentAnnouncement).data).toEqual({
      id: 'a1',
      date: 'd',
      important: true,
      createdAt: 'c',
      translations: {
        create: [{ languageCode: 'pl', title: 'T', content: 'C' }],
      },
    });

    await restoreDocument({
      id: 'd1',
      slug: 'genetyka',
      displayOrder: 2,
      statutePath: '/media/s.pdf',
      syllabusPath: '/media/y.pdf',
      translations: [
        { documentId: 'd1', languageCode: 'pl', subjectName: 'Genetyka' },
      ],
    } as never);
    expect(created(prisma.studentDocument).data).toEqual({
      id: 'd1',
      slug: 'genetyka',
      displayOrder: 2,
      statutePath: '/media/s.pdf',
      syllabusPath: '/media/y.pdf',
      translations: {
        create: [{ languageCode: 'pl', subjectName: 'Genetyka' }],
      },
    });
  });

  const slot = {
    id: 'c1',
    employeeId: 'e1',
    date: 'd',
    time: '10:00 - 12:00',
    room: null,
  };

  it('restores a consultation of an existing employee', async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: 'e1',
    } as never);
    await restoreConsultation(slot as unknown as ConsultationSnapshot);
    expect(prisma.consultation.create).toHaveBeenCalledWith({ data: slot });
  });

  it('refuses a consultation whose employee is gone', async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue(null);
    await expect(
      restoreConsultation(slot as unknown as ConsultationSnapshot)
    ).rejects.toThrow('Pracownik tego terminu już nie istnieje.');
    expect(prisma.consultation.create).not.toHaveBeenCalled();
  });
});

describe('employees', () => {
  it('reads seven days of hours, the same in every language', () => {
    const data = new FormData();
    data.set('hours_1', '  08:00 - 14:00 ');
    data.set('hours_5', 'x'.repeat(80));
    const days = weeklyHoursFrom(data);
    expect(days.map((d) => d.displayOrder)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(days[0].translations.create).toEqual([
      { languageCode: 'pl', day: 'Poniedziałek', hours: '08:00 - 14:00' },
      { languageCode: 'en', day: 'Monday', hours: '08:00 - 14:00' },
      { languageCode: 'uk', day: 'Понеділок', hours: '08:00 - 14:00' },
      { languageCode: 'ru', day: 'Понедельник', hours: '08:00 - 14:00' },
    ]);
    expect(days[1].translations.create[0].hours).toBe('');
    expect(days[4].translations.create[0].hours).toHaveLength(60);
  });

  it('restores an employee into the teams that still exist', async () => {
    vi.mocked(prisma.team.findMany).mockResolvedValue([{ id: 't1' }] as never);
    await restoreEmployee({
      id: 'e1',
      firstName: 'Anna',
      lastName: 'Kowalska',
      translations: [
        { employeeId: 'e1', languageCode: 'pl', academicTitle: 'dr' },
      ],
      teamMembers: [
        { id: 'm1', employeeId: 'e1', teamId: 't1', category: 'ACADEMIC' },
        { id: 'm2', employeeId: 'e1', teamId: 'gone', category: 'TECHNICAL' },
      ],
      consultations: [
        {
          id: 'c1',
          employeeId: 'e1',
          room: 'pok. 1',
          date: 'd',
          time: '10:00 - 11:00',
        },
      ],
    } as unknown as EmployeeSnapshot);

    expect(created(prisma.employee).data).toEqual({
      id: 'e1',
      firstName: 'Anna',
      lastName: 'Kowalska',
      translations: { create: [{ languageCode: 'pl', academicTitle: 'dr' }] },
      teamMembers: {
        create: [{ id: 'm1', teamId: 't1', category: 'ACADEMIC' }],
      },
      consultations: {
        create: [
          { id: 'c1', room: 'pok. 1', date: 'd', time: '10:00 - 11:00' },
        ],
      },
    });
  });
});

describe('teams', () => {
  it('restores a team with its people who still exist and its unclaimed publications', async () => {
    vi.mocked(prisma.employee.findMany).mockResolvedValue([
      { id: 'e1' },
    ] as never);
    const tr = (extra: object) => ({ languageCode: 'pl', ...extra });
    await restoreTeam({
      id: 't1',
      type: 'FULL',
      displayOrder: 1,
      translations: [
        tr({
          teamId: 't1',
          slug: 'bydlo',
          name: 'Bydło',
          researchDescription: 'R',
          teachingDescription: null,
        }),
      ],
      members: [
        { id: 'm1', teamId: 't1', employeeId: 'e1', category: 'ACADEMIC' },
        { id: 'm2', teamId: 't1', employeeId: 'gone', category: 'ACADEMIC' },
      ],
      publications: [{ id: 'p1' }],
      projects: [
        {
          id: 'pr1',
          teamId: 't1',
          years: '2024–',
          translations: [tr({ projectId: 'pr1', title: 'P', funder: 'NCN' })],
        },
      ],
      courses: [
        {
          id: 'c1',
          teamId: 't1',
          translations: [
            tr({
              courseId: 'c1',
              name: 'K',
              program: 'Zootechnika',
              coordinator: 'dr X',
            }),
          ],
        },
      ],
      links: [
        {
          id: 'l1',
          teamId: 't1',
          url: 'https://x.pl',
          icon: 'globe',
          displayOrder: 0,
          translations: [tr({ linkId: 'l1', label: 'Strona' })],
        },
      ],
    } as unknown as TeamSnapshot);

    const [teamCreate, publicationUpdate] = vi.mocked(prisma.$transaction).mock
      .calls[0][0] as unknown as [{ data: Record<string, unknown> }, unknown];
    expect(teamCreate.data).toEqual({
      id: 't1',
      type: 'FULL',
      displayOrder: 1,
      translations: {
        create: [
          tr({
            slug: 'bydlo',
            name: 'Bydło',
            researchDescription: 'R',
            teachingDescription: null,
          }),
        ],
      },
      members: {
        create: [{ id: 'm1', employeeId: 'e1', category: 'ACADEMIC' }],
      },
      projects: {
        create: [
          {
            id: 'pr1',
            years: '2024–',
            translations: { create: [tr({ title: 'P', funder: 'NCN' })] },
          },
        ],
      },
      courses: {
        create: [
          {
            id: 'c1',
            translations: {
              create: [
                tr({ name: 'K', program: 'Zootechnika', coordinator: 'dr X' }),
              ],
            },
          },
        ],
      },
      links: {
        create: [
          {
            id: 'l1',
            url: 'https://x.pl',
            icon: 'globe',
            displayOrder: 0,
            translations: { create: [tr({ label: 'Strona' })] },
          },
        ],
      },
    });
    // Publications moved to another team meanwhile stay where they are
    expect(publicationUpdate).toEqual({
      where: { id: { in: ['p1'] }, teamId: null },
      data: { teamId: 't1' },
    });
  });

  const publication = (teamId: string | null) =>
    ({
      id: 'p1',
      year: 2024,
      teamId,
      translations: [{ publicationId: 'p1', languageCode: 'pl', title: 'T' }],
    }) as unknown as PublicationSnapshot;

  it('returns a publication to its team when the team exists', async () => {
    vi.mocked(prisma.team.findUnique).mockResolvedValue({ id: 't1' } as never);
    await restorePublication(publication('t1'));
    expect(created(prisma.publication).data).toEqual({
      id: 'p1',
      year: 2024,
      teamId: 't1',
      translations: { create: [{ languageCode: 'pl', title: 'T' }] },
    });
  });

  it('restores a publication without a team when the team is gone or unset', async () => {
    vi.mocked(prisma.team.findUnique).mockResolvedValue(null);
    await restorePublication(publication('gone'));
    expect(created(prisma.publication).data.teamId).toBeNull();

    vi.clearAllMocks();
    await restorePublication(publication(null));
    expect(prisma.team.findUnique).not.toHaveBeenCalled();
    expect(created(prisma.publication).data.teamId).toBeNull();
  });
});

describe('TRASH_ENTITIES', () => {
  it('restores every kind of trashed item with its own model', async () => {
    vi.mocked(prisma.employee.findUnique).mockResolvedValue({
      id: 'e1',
    } as never);
    const base = {
      translations: [],
      tags: [],
      photos: [],
      teamMembers: [],
      consultations: [],
      members: [],
      publications: [],
      projects: [],
      courses: [],
      links: [],
    };
    const models = {
      news: prisma.news,
      announcement: prisma.studentAnnouncement,
      consultation: prisma.consultation,
      document: prisma.studentDocument,
      employee: prisma.employee,
      publication: prisma.publication,
    };
    for (const [entity, model] of Object.entries(models)) {
      await TRASH_ENTITIES[entity].restore(base as never);
      expect(model.create, entity).toHaveBeenCalled();
    }
    await TRASH_ENTITIES.team.restore(base as never);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(Object.values(TRASH_ENTITIES).every((e) => e.label)).toBe(true);
  });
});
