import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { auditInput, detectThreats } from '../security';

vi.mock('@/lib/prisma', () => ({
  prisma: { securityEvent: { create: vi.fn() } },
}));

const create = vi.mocked(prisma.securityEvent.create);
// Events are written without awaiting; let the dynamic import settle
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
});
afterEach(() => vi.useRealTimers());

describe('security events', () => {
  it('flags a null byte', () => {
    expect(detectThreats('plik%00.pdf').threats).toContain('null_byte');
  });

  it('stores a detected attack with a bounded preview', async () => {
    vi.setSystemTime(new Date('2026-09-29T10:00:00Z'));
    const input = `' OR 1=1 --${'x'.repeat(300)}`;
    auditInput('news search', input);
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith({
      data: {
        threats: ['sql_injection'],
        context: 'news search',
        preview: input.slice(0, 200),
      },
    });
  });

  it('stores at most 30 events a minute, then again in the next minute', async () => {
    vi.setSystemTime(new Date('2026-09-29T11:00:00Z'));
    for (let i = 0; i < 35; i++) auditInput('search', "' OR 1=1 --");
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(30));
    await settle();
    expect(create).toHaveBeenCalledTimes(30);

    vi.setSystemTime(new Date('2026-09-29T11:01:01Z'));
    auditInput('search', "' OR 1=1 --");
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(31));
  });

  it('keeps answering when the event cannot be stored', async () => {
    vi.setSystemTime(new Date('2026-09-29T12:00:00Z'));
    create.mockRejectedValueOnce(new Error('database down'));
    expect(auditInput('search', "' OR 1=1 --").detected).toBe(true);
    await settle();
  });

  it('stores nothing for ordinary input', async () => {
    auditInput('search', 'bydło mleczne');
    await settle();
    expect(create).not.toHaveBeenCalled();
  });
});
