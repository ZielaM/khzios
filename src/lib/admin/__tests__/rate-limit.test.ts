import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  isSignInLocked,
  MAX_FAILURES_PER_IP,
  MAX_FAILURES_PER_LOGIN,
} from '../rate-limit';

vi.mock('@/lib/prisma', () => ({
  prisma: { loginAttempt: { count: vi.fn() } },
}));

const count = vi.mocked(prisma.loginAttempt.count);

// First call counts failures for the login, the second for the address
function failures(byLogin: number, byIp: number) {
  count
    .mockResolvedValueOnce(byLogin as never)
    .mockResolvedValueOnce(byIp as never);
}

describe('isSignInLocked', () => {
  beforeEach(() => count.mockReset());

  it('locks a login after too many failures', async () => {
    failures(MAX_FAILURES_PER_LOGIN, 0);
    expect(await isSignInLocked('jan', '203.0.113.5')).toBe(true);
  });

  it('locks an address trying many logins', async () => {
    failures(0, MAX_FAILURES_PER_IP);
    expect(await isSignInLocked('jan', '203.0.113.5')).toBe(true);
  });

  it('does not lock by address when the address is not known', async () => {
    for (const ip of ['unknown', '::1', '127.0.0.1', '::ffff:127.0.0.1']) {
      count.mockReset();
      count.mockResolvedValue(0 as never);
      expect(await isSignInLocked('jan', ip)).toBe(false);
      // Only the per-login count was queried
      expect(count).toHaveBeenCalledTimes(1);
    }
  });
});
