import { describe, it, expect } from 'vitest';
import { getClientIp } from '../client-ip';

describe('getClientIp', () => {
  it('takes the address added by the reverse proxy (the last entry)', () => {
    // The first entry comes from the client and could be forged
    const headers = new Headers({ 'x-forwarded-for': '6.6.6.6, 203.0.113.5' });
    expect(getClientIp(headers)).toBe('203.0.113.5');
  });

  it('falls back to X-Real-IP and then to "unknown"', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': '203.0.113.7' }))).toBe(
      '203.0.113.7'
    );
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});
