// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import proxy from '../proxy';

vi.mock('@/i18n/routing', async (importOriginal) => importOriginal());
vi.mock('next/navigation', async (importOriginal) => importOriginal());
vi.mock('next-intl/middleware', () => ({
  default: () => () => new Response('localized site'),
}));

afterEach(() => vi.unstubAllEnvs());

const request = (path: string) =>
  new NextRequest(`https://khzios.up.poznan.pl${path}`);
const rewrittenTo = (response: Response) =>
  response.headers.get('x-middleware-rewrite');

describe('proxy', () => {
  it('serves the panel only under its unlisted address, without indexing or referrer', () => {
    vi.stubEnv('ADMIN_PATH', 'zaplecze-k7f2');
    const response = proxy(request('/zaplecze-k7f2/news/123?created=1'));
    expect(rewrittenTo(response)).toBe(
      'https://khzios.up.poznan.pl/admin-panel/news/123?created=1'
    );
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');

    expect(rewrittenTo(proxy(request('/zaplecze-k7f2')))).toBe(
      'https://khzios.up.poznan.pl/admin-panel'
    );
  });

  it('answers the internal panel route with the ordinary 404', () => {
    vi.stubEnv('ADMIN_PATH', 'zaplecze-k7f2');
    for (const path of ['/admin-panel', '/admin-panel/users']) {
      expect(rewrittenTo(proxy(request(path)))).toBe(
        'https://khzios.up.poznan.pl/not-found'
      );
    }
  });

  it('passes every other path to the localized site', async () => {
    vi.stubEnv('ADMIN_PATH', 'zaplecze-k7f2');
    for (const path of [
      '/pl/aktualnosci',
      '/zaplecze-k7f2abc',
      '/admin-panelx',
    ]) {
      const response = proxy(request(path));
      expect(rewrittenTo(response)).toBeNull();
      expect(await response.text()).toBe('localized site');
    }
  });

  it('has no panel in production without ADMIN_PATH', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_PATH', '');
    expect(await proxy(request('/admin')).text()).toBe('localized site');
  });
});
