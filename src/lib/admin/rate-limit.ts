import { prisma } from '@/lib/prisma';

const WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILURES_PER_LOGIN = 5;
export const MAX_FAILURES_PER_IP = 20;

// Without a reverse proxy passing the client address, every request appears
// to come from the loopback address; a per-address lock would then block
// everyone at once, so only the per-login limit applies
function isAddressKnown(ip: string) {
  return !(
    ip === 'unknown' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('::ffff:127.')
  );
}

/**
 * Whether sign-in is temporarily blocked: too many failures for this login
 * (password guessing on one account) or from this address (trying many
 * accounts) within the last 15 minutes.
 */
export async function isSignInLocked(login: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byLogin, byIp] = await Promise.all([
    prisma.loginAttempt.count({
      where: { login, success: false, createdAt: { gte: since } },
    }),
    !isAddressKnown(ip)
      ? Promise.resolve(0)
      : prisma.loginAttempt.count({
          where: { ip, success: false, createdAt: { gte: since } },
        }),
  ]);
  return byLogin >= MAX_FAILURES_PER_LOGIN || byIp >= MAX_FAILURES_PER_IP;
}

export function recordSignInAttempt(
  login: string,
  ip: string,
  success: boolean,
  reason?: string
) {
  return prisma.loginAttempt.create({
    data: { login: login.slice(0, 100), ip, success, reason },
  });
}
