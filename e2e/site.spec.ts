import { test, expect } from '@playwright/test';

test.describe('Site-wide addresses', () => {
  test('robots.txt allows the site, hides the API and names the sitemap', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBe(true);
    const text = await response.text();
    expect(text).toMatch(/User-Agent: \*/i);
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain(`Sitemap: ${baseURL}/sitemap.xml`);
  });

  test('sitemap.xml lists the pages of every language with their versions', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.headers()['content-type']).toContain('xml');
    const xml = await response.text();
    expect(xml).toContain(`<loc>${baseURL}/pl/aktualnosci</loc>`);
    expect(xml).toContain(`<loc>${baseURL}/en/news</loc>`);
    expect(xml).toContain(`hreflang="uk" href="${baseURL}/uk/`);
    // Team pages have their own address in each language
    expect(xml).toContain(`${baseURL}/pl/o-nas/struktura/weterynaryjna`);
    expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThan(40);
  });

  test('the health check reports the database as working', async ({
    request,
  }) => {
    const response = await request.get('/api/health');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  test('an unknown address gets the translated 404 page with a way back', async ({
    page,
  }) => {
    for (const [path, heading, back] of [
      [
        '/pl/nie-ma-takiej-strony',
        'Nie znaleziono strony',
        'Wróć na stronę główną',
      ],
      ['/en/no-such-page', 'Page Not Found', 'Back to homepage'],
    ]) {
      // Pages are streamed, so the status is sent before the page knows it
      // does not exist; noindex keeps these pages out of search results
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      // What search engines read: the page as the server sends it
      const html = await (await page.request.get(path)).text();
      expect(html).toContain('<meta name="robots" content="noindex"/>');
      await page.getByRole('link', { name: back }).click();
      await expect(page).toHaveURL(new RegExp(`${path.slice(0, 3)}$`));
    }
  });
});
