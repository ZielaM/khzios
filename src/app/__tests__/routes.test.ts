// @vitest-environment node
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getStudentSchedule } from '@/lib/student-queries';
import { GET as health } from '../api/health/route';
import { GET as schedule } from '../api/student-schedule/route';
import { GET as media } from '../media/[file]/route';
import robots from '../robots';

vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: vi.fn() } }));
vi.mock('@/lib/student-queries', () => ({ getStudentSchedule: vi.fn() }));

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe('/api/health', () => {
  it('reports ok while the database answers', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);
    const response = await health();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('reports 503 when the database is down (Docker marks it unhealthy)', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('refused'));
    const response = await health();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'error' });
  });
});

describe('/api/student-schedule', () => {
  it('returns the current schedule, never cached', async () => {
    const data = { announcements: [], consultations: [] };
    vi.mocked(getStudentSchedule).mockResolvedValue(data);
    const response = await schedule();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual(data);
  });

  it('answers 503 so the page can offer a retry', async () => {
    vi.mocked(getStudentSchedule).mockRejectedValue(new Error('refused'));
    const response = await schedule();
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

describe('/media/[file]', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'khz-media-'));
    vi.stubEnv('UPLOAD_DIR', dir);
    await writeFile(path.join(dir, 'statut-0123456789ab.pdf'), '%PDF-1.4');
    await writeFile(path.join(dir, 'obora-0123456789ab.webp'), 'RIFF');
  });
  const get = (file: string) =>
    media(new Request('http://localhost/media/x'), {
      params: Promise.resolve({ file }),
    });

  it('serves uploads with their type, cached for good', async () => {
    const pdf = await get('statut-0123456789ab.pdf');
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get('Content-Type')).toBe('application/pdf');
    expect(pdf.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable'
    );
    expect(pdf.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(await pdf.text()).toBe('%PDF-1.4');

    const webp = await get('obora-0123456789ab.webp');
    expect(webp.headers.get('Content-Type')).toBe('image/webp');
  });

  it('answers 404 for missing files and anything outside the upload folder', async () => {
    for (const file of [
      'brak-0123456789ab.pdf',
      '..%2F..%2Fetc%2Fpasswd',
      '../package.json',
      'skrypt-0123456789ab.js',
    ]) {
      expect((await get(file)).status, file).toBe(404);
    }
  });
});

describe('robots.txt', () => {
  it('allows the site, hides the API and points to the sitemap', () => {
    vi.stubEnv('APP_URL', 'https://khzios.up.poznan.pl');
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: '/api/' },
      sitemap: 'https://khzios.up.poznan.pl/sitemap.xml',
    });
  });
});
