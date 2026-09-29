import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../Navbar';

const teams = [{ name: 'Zespół testowy', slug: 'zespol-testowy' }];

// We mock subcomponents to isolate testing to Navbar logic
vi.mock('../NavItem', () => ({
  default: ({ label, onClick }: { label: string; onClick?: () => void }) => (
    <button data-testid={`nav-item-${label}`} onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('../DropdownMenu', () => ({
  DropdownMenu: ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => <div data-testid={`dropdown-${label}`}>{children}</div>,
  DropdownItem: ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div data-testid={`dropdown-item-${label}`}>
      <a href={`#${label}`}>{label}</a>
      {children}
    </div>
  ),
}));

vi.mock('../SettingsDropdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="settings-dropdown">{children}</div>
  ),
}));

vi.mock('@/components/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}));

// Removed static mock, replaced by the dynamic one below

// Provide a way to override pathname for specific test
let mockPathname = '/news';

vi.mock('@/i18n/routing', () => ({
  Link: ({
    children,
    onClick,
    'data-testid': testId,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    'data-testid'?: string;
  }) => (
    <a href="#" onClick={onClick} data-testid={testId}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
}));

vi.mock('../WcagControls', () => ({
  default: () => <div data-testid="wcag-controls" />,
}));

describe('Navbar', () => {
  it('renders logo and standard links', () => {
    render(<Navbar teams={teams} />);
    expect(screen.getByTestId('logo-link')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-news')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-forStudents')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-contact')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-aboutUs')).toBeInTheDocument();
  });

  it('links the sections of the student page under the students menu', () => {
    render(<Navbar teams={teams} />);
    const students = screen.getByTestId('dropdown-forStudents');
    for (const key of [
      'studentAnnouncements',
      'studentConsultations',
      'studentDocuments',
    ]) {
      expect(
        within(students).getByTestId(`dropdown-item-${key}`)
      ).toBeInTheDocument();
    }
  });

  it('closes the mobile menu when a link is followed, even to the same page', () => {
    render(<Navbar teams={teams} />);
    const toggle = screen.getByRole('button', { name: 'toggleMenu' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // A link that opens a submenu keeps the menu open
    const students = screen.getByTestId('dropdown-forStudents');
    const accordion = document.createElement('a');
    accordion.setAttribute('aria-haspopup', 'true');
    students.appendChild(accordion);
    fireEvent.click(accordion);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // A section link on the page already open: the pathname stays the same,
    // and Next's Link prevents the default action
    const link = screen.getByRole('link', { name: 'studentConsultations' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('lists the teams passed from the database under the structure menu', () => {
    render(<Navbar teams={teams} />);
    expect(
      screen.getByTestId('dropdown-item-Zespół testowy')
    ).toBeInTheDocument();
  });

  it('exposes the menu state and closes it with Escape', () => {
    render(<Navbar teams={teams} />);
    const toggle = screen.getByRole('button', { name: 'toggleMenu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'main-menu');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('toggles mobile menu when hamburger is clicked', () => {
    render(<Navbar teams={teams} />);
    const hamburger = screen.getByLabelText('toggleMenu');

    // Initial state
    expect(hamburger).not.toHaveClass('active');

    // Click opens menu
    fireEvent.click(hamburger);
    expect(hamburger).toHaveClass('active');

    // Click again closes menu
    fireEvent.click(hamburger);
    expect(hamburger).not.toHaveClass('active');
  });

  it('closes mobile menu when logo is clicked', () => {
    render(<Navbar teams={teams} />);
    const hamburger = screen.getByLabelText('toggleMenu');

    // Open menu
    fireEvent.click(hamburger);
    expect(hamburger).toHaveClass('active');

    // Click logo
    const logo = screen.getByTestId('logo-link');
    fireEvent.click(logo);

    expect(hamburger).not.toHaveClass('active');
  });

  it('closes mobile menu when a NavItem is clicked', () => {
    render(<Navbar teams={teams} />);
    const hamburger = screen.getByLabelText('toggleMenu');

    fireEvent.click(hamburger);
    expect(hamburger).toHaveClass('active');

    const newsItem = screen.getByTestId('nav-item-news');
    fireEvent.click(newsItem);

    expect(hamburger).not.toHaveClass('active');
  });

  it('closes mobile menu when pathname changes', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Navbar teams={teams} />);
    const hamburger = screen.getByLabelText('toggleMenu');

    fireEvent.click(hamburger);
    expect(hamburger).toHaveClass('active');

    // Simulate pathname change
    mockPathname = '/new-path';

    rerender(<Navbar teams={teams} />);

    // Fast-forward timeout inside useEffect wrapped in act
    act(() => {
      vi.runAllTimers();
    });

    expect(hamburger).not.toHaveClass('active');
    vi.useRealTimers();
  });
});
