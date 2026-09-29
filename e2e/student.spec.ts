import { test, expect, type Page } from '@playwright/test';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Serves a deterministic schedule so the announcement tests do not depend on
 * the dates the database was seeded with.
 */
async function mockSchedule(page: Page) {
  const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();
  const announcement = (id: string, days: number, title: string) => ({
    id,
    date: at(days),
    important: false,
    translations: [{ languageCode: 'pl', title, content: `${title} – treść` }],
  });

  await page.route('**/api/student-schedule', (route) =>
    route.fulfill({
      json: {
        announcements: [
          announcement('past', -3, 'Ogłoszenie sprzed trzech dni'),
          announcement('soon', 2, 'Ogłoszenie za dwa dni'),
        ],
        consultations: [
          {
            id: 'e1',
            firstName: 'Anna',
            lastName: 'Kowalska',
            officeLocation: 'pok. 110',
            translations: [{ languageCode: 'pl', academicTitle: 'dr' }],
            consultations: [
              { id: 'c1', date: at(5), time: '10:00 - 12:00', room: 'pok. 12' },
            ],
          },
        ],
      },
    })
  );
}

test.describe('For Students Page', () => {
  // The heading of a linked section must be on screen, below the fixed navbar
  async function expectSectionShown(page: Page, heading: string) {
    const target = page.getByRole('heading', { level: 2, name: heading });
    await expect(target).toBeInViewport();
    const navbar = await page.locator('nav').first().boundingBox();
    await expect
      .poll(async () => (await target.boundingBox())!.y)
      .toBeGreaterThanOrEqual(navbar!.height);
  }

  const SECTIONS = [
    ['Ogłoszenia', 'announcements', 'Ogłoszenia dla studentów'],
    ['Konsultacje', 'consultations', 'Konsultacje dla studentów'],
    ['Statuty i sylabusy', 'documents', 'Statuty i sylabusy'],
  ] as const;

  test('desktop: the students menu opens on hover and jumps to each section', async ({
    page,
  }) => {
    await mockSchedule(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = page.getByRole('navigation', { name: 'Menu główne' });

    for (const [item, hash, heading] of SECTIONS) {
      await page.goto('/pl');
      await nav.getByRole('link', { name: 'Dla studentów' }).hover();
      await nav.getByRole('link', { name: new RegExp(`^${item}`) }).click();
      await expect(page).toHaveURL(new RegExp(`/pl/student#${hash}$`));
      await expectSectionShown(page, heading);
    }

    // The menu entry itself still opens the page
    await page.goto('/pl');
    await nav.getByRole('link', { name: 'Dla studentów' }).click();
    await expect(page).toHaveURL(/\/pl\/student$/);
    await expect(page.locator('h1')).toHaveText('Dla studentów');
  });

  for (const [device, viewport] of [
    ['tablet', { width: 768, height: 1024 }],
    ['phone', { width: 375, height: 667 }],
  ] as const) {
    test(`${device}: the hamburger menu leads to the sections and closes`, async ({
      page,
    }) => {
      await mockSchedule(page);
      await page.setViewportSize(viewport);
      const toggle = page.getByRole('button', { name: 'Przełącz menu' });
      const nav = page.getByRole('navigation', { name: 'Menu główne' });
      const openStudents = async () => {
        await toggle.click();
        // The first tap opens the accordion instead of following the link
        const trigger = nav.getByRole('link', {
          name: 'Dla studentów',
          exact: true,
        });
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      };

      // From another page
      await page.goto('/pl');
      await openStudents();
      await nav.getByRole('link', { name: /^Konsultacje/ }).click();
      await expect(page).toHaveURL(/\/pl\/student#consultations$/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expectSectionShown(page, 'Konsultacje dla studentów');

      // On the page itself: only the hash changes, the menu still closes
      await openStudents();
      await nav.getByRole('link', { name: /^Statuty i sylabusy/ }).click();
      await expect(page).toHaveURL(/#documents$/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expectSectionShown(page, 'Statuty i sylabusy');

      // The overview entry opens the page from the top
      await openStudents();
      await nav.getByRole('link', { name: 'Strona „Dla studentów”' }).click();
      await expect(page).toHaveURL(/\/pl\/student$/);
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  }

  test('should display the consultation table from the live schedule', async ({
    page,
  }) => {
    await mockSchedule(page);
    await page.goto('/pl/student');

    const consultations = page.locator('section', {
      has: page.locator('h2', { hasText: 'Konsultacje dla studentów' }),
    });
    const row = consultations.locator('tbody tr').first();
    await expect(row.locator('th')).toHaveText('dr Anna Kowalska');
    await expect(row).toContainText('10:00 - 12:00');
    await expect(row).toContainText('pok. 12');
  });

  test('breadcrumbs lead back to the home page', async ({ page }) => {
    await page.goto('/pl/student');

    await page
      .getByRole('navigation', { name: 'Ścieżka nawigacji' })
      .getByRole('link', { name: 'Strona główna' })
      .click();

    // Assert redirect
    await expect(page).toHaveURL(/.*\/pl$/);
  });

  test('should display student announcements and toggle past ones', async ({
    page,
  }) => {
    await mockSchedule(page);
    await page.goto('/pl/student');

    await expect(
      page.locator('h2', { hasText: 'Ogłoszenia dla studentów' })
    ).toBeVisible();

    const announcements = page.getByTestId('announcement');
    await expect(announcements).toHaveCount(1);
    await expect(announcements).toHaveText(/Ogłoszenie za dwa dni/);

    const toggle = page.getByRole('switch', {
      name: 'Wyświetl przeszłe ogłoszenia',
    });
    await expect(toggle).not.toBeChecked();
    // The visual switch is the label; the native checkbox is visually hidden
    await page
      .locator('label', { hasText: 'Wyświetl przeszłe ogłoszenia' })
      .click();
    await expect(toggle).toBeChecked();

    await expect(announcements).toHaveCount(2);
    await expect(announcements.first()).toContainText(
      'Ogłoszenie sprzed trzech dni'
    );
  });
});
