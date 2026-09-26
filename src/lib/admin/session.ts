import { cache } from 'react';
import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { AdminRole } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getAppUrl } from '@/lib/env';
import { getClientIp } from './client-ip';

const ABSOLUTE_LIFETIME_MS = 8 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
// lastSeenAt is written at most once a minute, not on every request
const TOUCH_INTERVAL_MS = 60 * 1000;

// Secure (and so __Host-) whenever the public address is https, which is
// always the case in production. Plain-http development and e2e runs need
// an ordinary cookie: Safari refuses Secure cookies on http://localhost.
const secureCookies = () => getAppUrl().startsWith('https://');
const cookieName = () => (secureCookies() ? '__Host-khz-admin' : 'khz-admin');

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/** Starts a session; the second factor is still pending unless mfaPassed. */
export async function createSession(userId: string, mfaPassed = false) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + ABSOLUTE_LIFETIME_MS);
  const requestHeaders = await headers();

  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      mfaPassed,
      expiresAt,
      ip: getClientIp(requestHeaders),
      userAgent: requestHeaders.get('user-agent')?.slice(0, 300),
    },
  });

  (await cookies()).set(cookieName(), token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * The session from the cookie with its user, or null when there is none or
 * it has expired (absolute lifetime or inactivity). Cached per request.
 */
export const getSession = cache(async () => {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session?.user) return null;

  const now = Date.now();
  if (
    session.expiresAt.getTime() <= now ||
    now - session.lastSeenAt.getTime() > IDLE_TIMEOUT_MS ||
    session.user.disabled
  ) {
    await prisma.adminSession.deleteMany({ where: { tokenHash } });
    return null;
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.adminSession.update({
      where: { tokenHash },
      data: { lastSeenAt: new Date(now) },
    });
  }
  return session;
});

export type AdminSessionWithUser = NonNullable<
  Awaited<ReturnType<typeof getSession>>
>;

export async function markSessionMfaPassed() {
  const session = await getSession();
  if (!session) return;
  await prisma.adminSession.update({
    where: { tokenHash: session.tokenHash },
    data: { mfaPassed: true },
  });
}

/** Signs out this browser. */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName())?.value;
  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  cookieStore.delete(cookieName());
}

/** Signs a user out everywhere, e.g. after a password change or 2FA reset. */
export async function destroyUserSessions(
  userId: string,
  exceptCurrent = false
) {
  const current = exceptCurrent ? (await getSession())?.tokenHash : undefined;
  await prisma.adminSession.deleteMany({
    where: { userId, ...(current && { NOT: { tokenHash: current } }) },
  });
}

const ROLE_RANK: Record<AdminRole, number> = { EDITOR: 1, ADMIN: 2 };

export function hasRole(role: AdminRole, required: AdminRole) {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/**
 * The signed-in user for panel pages and actions. Anything short of a full
 * sign-in (no session, 2FA pending, password change pending, missing role)
 * is answered with 404, so the panel's pages do not reveal themselves.
 * Checked in every page and action, not only in the proxy.
 */
export async function requireUser(role: AdminRole = 'EDITOR') {
  const session = await getSession();
  if (
    !session?.mfaPassed ||
    session.user.mustChangePassword ||
    !hasRole(session.user.role, role)
  ) {
    notFound();
  }
  return session.user;
}
