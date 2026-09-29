import { createHash } from 'node:crypto';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createSession,
  destroySession,
  destroyUserSessions,
  getSession,
  hasRole,
  markSessionMfaPassed,
  requireUser,
} from '../session';

const jar = new Map<string, string>();
const cookieStore = {
  get: (name: string) =>
    jar.has(name) ? { name, value: jar.get(name)! } : undefined,
  set: vi.fn<
    (name: string, value: string, options: Record<string, unknown>) => void
  >((name, value) => {
    jar.set(name, value);
  }),
  delete: vi.fn((name: string) => jar.delete(name)),
};
let requestHeaders = new Headers();

vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () => requestHeaders,
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('react', () => ({ cache: <T>(fn: T) => fn }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

const db = vi.mocked(prisma.adminSession);
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const NOW = new Date('2026-09-29T10:00:00Z').getTime();
const minutesAgo = (m: number) => new Date(NOW - m * 60_000);

type Stored = Awaited<ReturnType<typeof prisma.adminSession.findUnique>>;
function storedSession(overrides: Record<string, unknown> = {}) {
  const { user, ...rest } = overrides;
  return {
    tokenHash: sha256('token'),
    userId: 'u1',
    mfaPassed: true,
    expiresAt: new Date(NOW + 60 * 60_000),
    lastSeenAt: minutesAgo(0.5),
    user: {
      id: 'u1',
      role: 'EDITOR',
      disabled: false,
      mustChangePassword: false,
      ...(user as object),
    },
    ...rest,
  } as unknown as Stored;
}

beforeEach(() => {
  vi.clearAllMocks();
  jar.clear();
  requestHeaders = new Headers();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.stubEnv('APP_URL', 'https://khzios.up.poznan.pl');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('createSession', () => {
  it('stores only a hash of the token and sets a strict, secure cookie', async () => {
    requestHeaders = new Headers({
      'x-forwarded-for': '203.0.113.7',
      'user-agent': 'x'.repeat(500),
    });
    await createSession('u1');

    const [name, token, options] = cookieStore.set.mock.calls[0];
    expect(name).toBe('__Host-khz-admin');
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      expires: new Date(NOW + 8 * 60 * 60_000),
    });
    expect(db.create).toHaveBeenCalledWith({
      data: {
        tokenHash: sha256(token),
        userId: 'u1',
        mfaPassed: false,
        expiresAt: new Date(NOW + 8 * 60 * 60_000),
        ip: '203.0.113.7',
        userAgent: 'x'.repeat(300),
      },
    });
  });

  it('uses a plain cookie on http (Safari rejects Secure on localhost)', async () => {
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    await createSession('u1', true);
    const [name, , options] = cookieStore.set.mock.calls[0];
    expect(name).toBe('khz-admin');
    expect(options.secure).toBe(false);
    expect(db.create.mock.calls[0][0].data).toMatchObject({
      mfaPassed: true,
      userAgent: undefined,
    });
  });
});

describe('getSession', () => {
  beforeEach(() => jar.set('__Host-khz-admin', 'token'));

  it('returns null without a cookie, without asking the database', async () => {
    jar.clear();
    expect(await getSession()).toBeNull();
    expect(db.findUnique).not.toHaveBeenCalled();
  });

  it('looks the session up by the hash of the cookie', async () => {
    db.findUnique.mockResolvedValue(null);
    expect(await getSession()).toBeNull();
    expect(db.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: sha256('token') },
      include: { user: true },
    });
  });

  it.each([
    ['past its absolute lifetime', { expiresAt: new Date(NOW) }],
    ['idle for over 30 minutes', { lastSeenAt: minutesAgo(31) }],
    ['of a disabled account', { user: { disabled: true } }],
  ])('ends a session %s', async (_, overrides) => {
    db.findUnique.mockResolvedValue(storedSession(overrides));
    expect(await getSession()).toBeNull();
    expect(db.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: sha256('token') },
    });
  });

  it('returns a live session without writing when seen in the last minute', async () => {
    const session = storedSession();
    db.findUnique.mockResolvedValue(session);
    expect(await getSession()).toBe(session);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.deleteMany).not.toHaveBeenCalled();
  });

  it('records activity at most once a minute', async () => {
    db.findUnique.mockResolvedValue(
      storedSession({ lastSeenAt: minutesAgo(29) })
    );
    expect(await getSession()).not.toBeNull();
    expect(db.update).toHaveBeenCalledWith({
      where: { tokenHash: sha256('token') },
      data: { lastSeenAt: new Date(NOW) },
    });
  });
});

describe('markSessionMfaPassed', () => {
  it('marks the current session', async () => {
    jar.set('__Host-khz-admin', 'token');
    db.findUnique.mockResolvedValue(storedSession({ mfaPassed: false }));
    await markSessionMfaPassed();
    expect(db.update).toHaveBeenCalledWith({
      where: { tokenHash: sha256('token') },
      data: { mfaPassed: true },
    });
  });

  it('does nothing without a session', async () => {
    await markSessionMfaPassed();
    expect(db.update).not.toHaveBeenCalled();
  });
});

describe('destroySession', () => {
  it('deletes the session and the cookie', async () => {
    jar.set('__Host-khz-admin', 'token');
    await destroySession();
    expect(db.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: sha256('token') },
    });
    expect(jar.size).toBe(0);
  });

  it('only clears the cookie when there is no session', async () => {
    await destroySession();
    expect(db.deleteMany).not.toHaveBeenCalled();
    expect(cookieStore.delete).toHaveBeenCalledWith('__Host-khz-admin');
  });
});

describe('destroyUserSessions', () => {
  it('signs the user out everywhere', async () => {
    await destroyUserSessions('u1');
    expect(db.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('can keep the current browser signed in', async () => {
    jar.set('__Host-khz-admin', 'token');
    db.findUnique.mockResolvedValue(storedSession());
    await destroyUserSessions('u1', true);
    expect(db.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', NOT: { tokenHash: sha256('token') } },
    });
  });
});

describe('roles', () => {
  it('ranks administrators above editors', () => {
    expect(hasRole('ADMIN', 'EDITOR')).toBe(true);
    expect(hasRole('ADMIN', 'ADMIN')).toBe(true);
    expect(hasRole('EDITOR', 'EDITOR')).toBe(true);
    expect(hasRole('EDITOR', 'ADMIN')).toBe(false);
  });
});

describe('requireUser', () => {
  beforeEach(() => jar.set('__Host-khz-admin', 'token'));

  it('returns the user of a complete sign-in', async () => {
    db.findUnique.mockResolvedValue(storedSession({ user: { role: 'ADMIN' } }));
    expect(await requireUser('ADMIN')).toMatchObject({ id: 'u1' });
  });

  it.each([
    ['no session', null],
    ['a pending second factor', storedSession({ mfaPassed: false })],
    [
      'a pending password change',
      storedSession({ user: { mustChangePassword: true } }),
    ],
    ['a missing role', storedSession()],
  ])('answers 404 for %s', async (_, session) => {
    db.findUnique.mockResolvedValue(session);
    await expect(requireUser('ADMIN')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
