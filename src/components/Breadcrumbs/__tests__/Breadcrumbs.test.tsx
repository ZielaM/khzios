import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Breadcrumbs from '../Breadcrumbs';

afterEach(() => vi.unstubAllEnvs());

describe('Breadcrumbs', () => {
  it('leads from the home page through the parents to the current page', () => {
    render(
      <Breadcrumbs
        items={[{ label: 'O nas', href: '/about-us' }]}
        current="Struktura"
      />
    );
    const nav = screen.getByRole('navigation', { name: 'label' });
    const items = within(nav).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      'home',
      'O nas',
      'Struktura',
    ]);
    expect(within(nav).getByRole('link', { name: 'home' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(within(nav).getByRole('link', { name: 'O nas' })).toHaveAttribute(
      'href',
      '/about-us'
    );
    // The current page is marked, not linked
    expect(items[2]).toHaveAttribute('aria-current', 'page');
    expect(within(items[2]).queryByRole('link')).toBeNull();
  });

  it('describes the trail as BreadcrumbList data with absolute addresses', () => {
    vi.stubEnv('APP_URL', 'https://khzios.up.poznan.pl');
    const { container } = render(
      <Breadcrumbs
        items={[{ label: 'O nas', href: '/about-us' }]}
        current="Struktura"
      />
    );
    const data = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!
        .textContent!
    );
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'home',
          item: 'https://khzios.up.poznan.pl/pl/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'O nas',
          item: 'https://khzios.up.poznan.pl/pl/about-us',
        },
        { '@type': 'ListItem', position: 3, name: 'Struktura' },
      ],
    });
  });
});
