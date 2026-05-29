import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactProfile from '../ContactProfile';

describe('ContactProfile Logic', () => {
  const defaultProps = {
    name: 'Jane Doe',
    title: 'Dr.',
    email: 'jane@example.com',
    phone: '+48 555 123 456',
    officeLocation: 'Room 200',
    workingHours: [],
  };

  it('renders standard contact list when both email and phone are present', () => {
    const { container } = render(<ContactProfile {...defaultProps} />);

    // Should render a ul for the contact list
    const ul = container.querySelector('.contactList');
    expect(ul).toBeInTheDocument();

    // Should render the actual items
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('+48 555 123 456')).toBeInTheDocument();
  });

  it('gracefully falls back to localized "noContact" string when both are missing', () => {
    const { container } = render(
      <ContactProfile {...defaultProps} email="" phone="" />
    );

    // Strict requirement: ul must NOT be rendered if there are no items
    const ul = container.querySelector('.contactList');
    expect(ul).not.toBeInTheDocument();

    // Strict requirement: fallback text element MUST be present with .noData class
    const fallback = container.querySelector('.noData');
    expect(fallback).toBeInTheDocument();

    // 'noContact' is the key returned by our next-intl mock
    expect(screen.getByText('noContact')).toBeInTheDocument();
  });

  it('trims whitespace and removes spaces from phone hrefs', () => {
    render(<ContactProfile {...defaultProps} phone=" +48 111 222 333 " />);

    // The visual presentation might preserve some formatting,
    // but the `href` attribute must strip spaces to work on mobile dialers.
    const telLink = screen.getByText('+48 111 222 333').closest('a');

    expect(telLink).toHaveAttribute('href', 'tel:+48111222333');
  });

  it('ignores whitespace-only strings for fallback logic', () => {
    const { container } = render(
      <ContactProfile {...defaultProps} email="   " phone="   " />
    );
    const ul = container.querySelector('.contactList');
    expect(ul).not.toBeInTheDocument();
    expect(screen.getByText('noContact')).toBeInTheDocument();
  });

  it('gracefully handles arbitrary wrong types like objects or numbers', () => {
    // Pass completely wrong types to strings and arrays to ensure Array.isArray and typeof checks work
    const { container } = render(
      <ContactProfile
        {...defaultProps}
        email={{ invalid: true } as unknown as string}
        phone={123456 as unknown as string}
        // @ts-expect-error testing invalid input
        workingHours={'not an array'}
      />
    );

    // It should render safely without crashing and fallback appropriately
    const ul = container.querySelector('.contactList');
    expect(ul).not.toBeInTheDocument();
    expect(screen.getByText('noContact')).toBeInTheDocument();

    // Working hours should be rendered as empty list
    const hoursList = container.querySelector('.hoursList');
    expect(hoursList?.children.length).toBe(0);
  });
});
