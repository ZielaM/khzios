import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { deleteMedia } from '../storage';
import {
  deleteMediaIfUnused,
  isMediaUsed,
  mediaUrlsIn,
  moveToTrash,
  purgeExpiredTrash,
  purgeTrashItem,
  trashDaysLeft,
} from '../trash';

vi.mock('../storage', () => ({
  MEDIA_PREFIX: '/media/',
  deleteMedia: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    photo: { count: vi.fn() },
    employee: { count: vi.fn() },
    studentDocument: { count: vi.fn() },
    siteImage: { count: vi.fn() },
    $queryRaw: vi.fn(),
    trashItem: { findUnique: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
  },
}));

const NOW = new Date('2026-09-29T12:00:00Z').getTime();
const DAY = 86_400_000;

/** How many records of each kind use the media file. */
function usage({ photos = 0, trash = 0 } = {}) {
  vi.mocked(prisma.photo.count).mockResolvedValue(photos);
  vi.mocked(prisma.employee.count).mockResolvedValue(0);
  vi.mocked(prisma.studentDocument.count).mockResolvedValue(0);
  vi.mocked(prisma.siteImage.count).mockResolvedValue(0);
  vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(trash) }]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('mediaUrlsIn', () => {
  it('finds uploaded files anywhere in a snapshot', () => {
    expect(
      mediaUrlsIn({
        photoUrl: '/media/portret-0123456789ab.webp',
        website: 'https://example.org/media/x',
        photos: [
          { url: '/media/a-0123456789ab.webp' },
          { url: '/images/b.jpg' },
        ],
        count: 3,
        empty: null,
      })
    ).toEqual([
      '/media/portret-0123456789ab.webp',
      '/media/a-0123456789ab.webp',
    ]);
  });
});

describe('moveToTrash', () => {
  it('stores a JSON copy of the record with a shortened label', async () => {
    const create = vi.fn();
    const tx = { trashItem: { create } } as unknown as Parameters<
      typeof moveToTrash
    >[0];
    const date = new Date('2026-01-02T03:04:05Z');
    await moveToTrash(
      tx,
      { login: 'redaktor' },
      { entity: 'news', entityId: 'n1', label: 'x'.repeat(400), data: { date } }
    );
    expect(create).toHaveBeenCalledWith({
      data: {
        entity: 'news',
        entityId: 'n1',
        label: 'x'.repeat(300),
        // Dates become strings, as they come back from a JSON column
        data: { date: '2026-01-02T03:04:05.000Z' },
        deletedBy: 'redaktor',
      },
    });
  });
});

describe('isMediaUsed', () => {
  it('is false when nothing refers to the file', async () => {
    usage();
    expect(await isMediaUsed('/media/a.webp', 't1')).toBe(false);
  });

  it('counts other trashed items, not the one being purged', async () => {
    usage({ trash: 1 });
    expect(await isMediaUsed('/media/a.webp', 't1')).toBe(true);
    const [sql, ...values] = vi.mocked(prisma.$queryRaw).mock.calls[0];
    expect((sql as TemplateStringsArray).join('?')).toContain('WHERE id <> ?');
    expect(values).toEqual(['t1', '%/media/a.webp%']);
  });

  it('is true when a record still shows the file', async () => {
    usage({ photos: 1 });
    expect(await isMediaUsed('/media/a.webp')).toBe(true);
    expect(vi.mocked(prisma.$queryRaw).mock.calls[0][1]).toBe('');
  });
});

describe('purgeTrashItem', () => {
  it('deletes the item and only the files nothing else uses', async () => {
    vi.mocked(prisma.trashItem.findUnique).mockResolvedValue({
      id: 't1',
      data: {
        photos: [{ url: '/media/used.webp' }, { url: '/media/free.webp' }],
      },
    } as never);
    vi.mocked(prisma.photo.count).mockImplementation((async (args: {
      where: { url: string };
    }) => (args.where.url === '/media/used.webp' ? 1 : 0)) as never);
    vi.mocked(prisma.employee.count).mockResolvedValue(0);
    vi.mocked(prisma.studentDocument.count).mockResolvedValue(0);
    vi.mocked(prisma.siteImage.count).mockResolvedValue(0);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(0) }]);

    await purgeTrashItem('t1');
    expect(prisma.trashItem.delete).toHaveBeenCalledWith({
      where: { id: 't1' },
    });
    expect(deleteMedia).toHaveBeenCalledTimes(1);
    expect(deleteMedia).toHaveBeenCalledWith('/media/free.webp');
  });

  it('ignores an item that is already gone', async () => {
    vi.mocked(prisma.trashItem.findUnique).mockResolvedValue(null);
    await purgeTrashItem('t1');
    expect(prisma.trashItem.delete).not.toHaveBeenCalled();
  });
});

describe('expiry', () => {
  it('counts down the 30 days and never below zero', () => {
    expect(trashDaysLeft(new Date(NOW))).toBe(30);
    expect(trashDaysLeft(new Date(NOW - 29.5 * DAY))).toBe(1);
    expect(trashDaysLeft(new Date(NOW - 45 * DAY))).toBe(0);
  });

  it('purges the items older than 30 days', async () => {
    vi.mocked(prisma.trashItem.findMany).mockResolvedValue([
      { id: 'old' },
    ] as never);
    vi.mocked(prisma.trashItem.findUnique).mockResolvedValue({
      id: 'old',
      data: {},
    } as never);
    await purgeExpiredTrash();
    expect(prisma.trashItem.findMany).toHaveBeenCalledWith({
      where: { deletedAt: { lt: new Date(NOW - 30 * DAY) } },
      select: { id: true },
    });
    expect(prisma.trashItem.delete).toHaveBeenCalledWith({
      where: { id: 'old' },
    });
  });
});

describe('deleteMediaIfUnused', () => {
  it('deletes an unused file and skips empty or used ones', async () => {
    await deleteMediaIfUnused(null);
    expect(prisma.photo.count).not.toHaveBeenCalled();

    usage({ photos: 1 });
    await deleteMediaIfUnused('/media/a.webp');
    expect(deleteMedia).not.toHaveBeenCalled();

    usage();
    await deleteMediaIfUnused('/media/a.webp');
    expect(deleteMedia).toHaveBeenCalledWith('/media/a.webp');
  });
});
