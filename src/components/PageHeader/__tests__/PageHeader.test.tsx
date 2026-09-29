import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageHeader from '../PageHeader';

describe('PageHeader', () => {
  it('shows the title, lead, extra controls and the breadcrumbs', () => {
    render(
      <PageHeader
        title="Aktualności"
        lead="Wydarzenia z katedry"
        breadcrumbs={[]}
      >
        <button type="button">Szukaj</button>
      </PageHeader>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Aktualności' })
    ).toBeInTheDocument();
    expect(screen.getByText('Wydarzenia z katedry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Szukaj' })).toBeInTheDocument();
    // The title ends the breadcrumb trail
    expect(
      screen.getByText('Aktualności', { selector: '[aria-current="page"]' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('can show a heading with markup and a photo with its description', () => {
    render(
      <PageHeader
        title="Zespół bydła"
        heading={
          <span>
            Zespół <mark>bydła</mark>
          </span>
        }
        breadcrumbs={[]}
        image={{
          src: '/media/obora-0123456789ab.webp',
          alt: 'Obora doświadczalna',
        }}
      />
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Zespół bydła'
    );
    expect(
      screen.getByRole('heading', { level: 1 }).querySelector('mark')
    ).not.toBeNull();
    expect(
      screen.getByRole('img', { name: 'Obora doświadczalna' })
    ).toHaveAttribute('src', '/media/obora-0123456789ab.webp');
    expect(screen.queryByText('Wydarzenia z katedry')).toBeNull();
  });
});
