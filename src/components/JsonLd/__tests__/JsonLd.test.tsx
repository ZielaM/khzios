import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import JsonLd from '../JsonLd';

describe('JsonLd', () => {
  it('renders the data as JSON-LD', () => {
    const { container } = render(
      <JsonLd data={{ '@type': 'Thing', name: 'A' }} />
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(JSON.parse(script?.textContent ?? '')).toEqual({
      '@type': 'Thing',
      name: 'A',
    });
  });

  it('cannot be broken out of with a closing script tag', () => {
    const { container } = render(
      <JsonLd data={{ name: '</script><script>alert(1)</script>' }} />
    );
    const html = container.innerHTML;
    expect(html).not.toContain('</script><script>');
    expect(
      JSON.parse(container.querySelector('script')?.textContent ?? '')
    ).toEqual({
      name: '</script><script>alert(1)</script>',
    });
  });
});
