import { vi, describe, it, expect, afterEach } from 'vitest';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkbox, field, translations } from '../form';
import { logAudit, purgeOldLogs } from '../audit';
import { adminHref } from '../paths';
import { revalidatePublicSite } from '../revalidate';
import { slugify } from '../slug';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: { create: vi.fn() },
    loginAttempt: { deleteMany: vi.fn() },
    securityEvent: { deleteMany: vi.fn() },
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  Object.entries(entries).forEach(([k, v]) => data.append(k, v));
  return data;
};

describe('form fields', () => {
  it('trims and limits text, empty when missing', () => {
    const data = form({ title: '  Tytuł artykułu  ' });
    expect(field(data, 'title')).toBe('Tytuł artykułu');
    expect(field(data, 'title', 5)).toBe('Tytuł');
    expect(field(data, 'missing')).toBe('');
  });

  it('reads a checkbox as on or off', () => {
    expect(checkbox(form({ published: 'on' }), 'published')).toBe(true);
    expect(checkbox(form({}), 'published')).toBe(false);
  });

  it('collects the language versions that have any text', () => {
    const data = form({
      title_pl: 'Tytuł',
      content_pl: 'Treść',
      title_en: 'Title',
      title_uk: '   ',
      content_ru: 'x'.repeat(20),
    });
    expect(translations(data, ['title', 'content'], { content: 10 })).toEqual([
      { languageCode: 'pl', values: { title: 'Tytuł', content: 'Treść' } },
      { languageCode: 'en', values: { title: 'Title', content: '' } },
      { languageCode: 'ru', values: { title: '', content: 'x'.repeat(10) } },
    ]);
  });
});

describe('audit log', () => {
  it('records who changed what, with a bounded summary', async () => {
    await logAudit(
      { id: 'u1', login: 'ziela' },
      'update',
      'news',
      's'.repeat(600),
      'n1'
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        userLogin: 'ziela',
        action: 'update',
        entity: 'news',
        entityId: 'n1',
        summary: 's'.repeat(500),
      },
    });
  });

  it('keeps sign-in and security records for 90 days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T00:00:00Z'));
    await purgeOldLogs();
    const where = {
      where: { createdAt: { lt: new Date('2026-07-01T00:00:00Z') } },
    };
    expect(prisma.loginAttempt.deleteMany).toHaveBeenCalledWith(where);
    expect(prisma.securityEvent.deleteMany).toHaveBeenCalledWith(where);
  });
});

describe('panel paths', () => {
  it('builds links under the configured panel address', () => {
    vi.stubEnv('ADMIN_PATH', 'zaplecze-k7f2');
    expect(adminHref()).toBe('/zaplecze-k7f2');
    expect(adminHref('/news')).toBe('/zaplecze-k7f2/news');
  });
});

describe('revalidatePublicSite', () => {
  it('refreshes every localized page and the sitemap', () => {
    revalidatePublicSite();
    expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });
});

describe('slugify', () => {
  it('makes readable ASCII addresses from Polish names', () => {
    expect(slugify('Zespół Hodowli Bydła – Łódź')).toBe(
      'zespol-hodowli-bydla-lodz'
    );
    expect(slugify('  --Świnie & drób!  ')).toBe('swinie-drob');
    expect(slugify('Ab Cd', 3)).toBe('ab-');
    expect(slugify('Кафедра')).toBe('');
  });
});
