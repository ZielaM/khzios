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
  test('should navigate to the student consultations page via desktop navbar', async ({
    page,
  }) => {
    // Set viewport to a desktop size
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/pl');

    // Click the link in the navbar
    await page.click('nav >> text="Dla studenta"');

    // Wait for URL to be correct
    await expect(page).toHaveURL(/.*\/student/);

    // Verify the page title
    await expect(page.locator('h1')).toHaveText('Dla studentów');
  });

  test('should navigate to the student consultations page via mobile menu', async ({
    page,
  }) => {
    // Set viewport to a mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/pl');

    // Open hamburger menu
    await page.click('button[aria-label="Przełącz menu"]');

    // Click the link inside the mobile menu
    await page.click('text="Dla studenta"');

    // Wait for URL to be correct
    await expect(page).toHaveURL(/.*\/student/);

    // Verify the page title
    await expect(page.locator('h1')).toHaveText('Dla studentów');
  });

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

  test('BackLink should redirect to home page', async ({ page }) => {
    await page.goto('/pl/student');

    const backLink = page.locator('a', { hasText: 'Wróć do strony głównej' });
    await backLink.click();

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
