import { test, expect } from '@playwright/test';

test.describe('Team page', () => {
  test('puts the research focus first and lists the work without tabs', async ({
    page,
  }) => {
    await page.goto('/en/about-us/structure/ruminants');

    const header = page.locator('main header').first();
    await expect(header.getByRole('heading', { level: 1 })).toBeVisible();
    // The research description is the header's lead paragraph
    await expect(header.locator('p')).not.toBeEmpty();

    await expect(
      page.getByRole('heading', { level: 2, name: 'Team Members' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /^Publications/ })
    ).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
  });

  test('opens a member profile from the team list', async ({ page }) => {
    await page.goto('/en/about-us/structure/ruminants');

    const member = page
      .locator('main section')
      .first()
      .getByRole('link')
      .first();
    const name = await member.textContent();
    await member.click();

    await expect(page).toHaveURL(/\/en\/about-us\/structure\/ruminants\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name!);
  });

  test('an external team links to its own site in a new tab', async ({
    page,
  }) => {
    await page.goto('/pl/o-nas/struktura/weterynaryjna');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Pracownia Weterynaryjnej Ochrony Zdrowia Publicznego',
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        'Strona tego zespołu jest dostępna pod adresem zewnętrznym.'
      )
    ).toBeVisible();
    const link = page.getByRole('link', { name: /Przejdź na stronę/ });
    await expect(link).toHaveAttribute('href', 'https://example.com');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });
});
