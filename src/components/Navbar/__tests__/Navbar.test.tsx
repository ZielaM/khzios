import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../Navbar';

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
  }) => <div data-testid={`dropdown-item-${label}`}>{children}</div>,
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
    render(<Navbar />);
    expect(screen.getByTestId('logo-link')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-news')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-forStudents')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-contact')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-aboutUs')).toBeInTheDocument();
  });

  it('toggles mobile menu when hamburger is clicked', () => {
    render(<Navbar />);
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
    render(<Navbar />);
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
    render(<Navbar />);
    const hamburger = screen.getByLabelText('toggleMenu');

    fireEvent.click(hamburger);
    expect(hamburger).toHaveClass('active');

    const newsItem = screen.getByTestId('nav-item-news');
    fireEvent.click(newsItem);

    expect(hamburger).not.toHaveClass('active');
  });

  it('closes mobile menu when pathname changes', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Navbar />);
    const hamburger = screen.getByLabelText('toggleMenu');

    fireEvent.click(hamburger);
    expect(hamburger).toHaveClass('active');

    // Simulate pathname change
    mockPathname = '/new-path';

    rerender(<Navbar />);

    // Fast-forward timeout inside useEffect wrapped in act
    act(() => {
      vi.runAllTimers();
    });

    expect(hamburger).not.toHaveClass('active');
    vi.useRealTimers();
  });
});
