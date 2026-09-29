import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DropdownMenu, DropdownItem } from '../DropdownMenu';

describe('DropdownMenu and DropdownItem', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset innerWidth before each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  describe('Desktop behavior', () => {
    it('opens dropdown on mouse enter and closes on mouse leave', () => {
      render(
        <DropdownMenu label="About" href="/about-us">
          <DropdownItem label="Team" href="/about-us/structure" />
        </DropdownMenu>
      );

      const dropdownContainer = screen.getByText('About').parentElement!;

      // Hover over container
      fireEvent.mouseEnter(dropdownContainer);

      // The menu should have the 'show' class
      const menu = screen.getByText('seeLabel:{"label":"About"}').parentElement!
        .parentElement!;
      expect(menu).toHaveClass('show');

      // Leave container
      fireEvent.mouseLeave(dropdownContainer);
      expect(menu).not.toHaveClass('show');

      // Test blur with external target
      fireEvent.focus(dropdownContainer);
      expect(menu).toHaveClass('show');

      fireEvent.blur(dropdownContainer, { relatedTarget: document.body });
      expect(menu).not.toHaveClass('show');
    });

    it('does not prevent default on click on desktop', () => {
      render(
        <DropdownMenu label="About" href="/about-us">
          <DropdownItem label="Team" href="/about-us/structure" />
        </DropdownMenu>
      );
      const link = screen.getAllByRole('link', { name: /About/i })[0];
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      fireEvent(link, clickEvent);
      expect(clickEvent.defaultPrevented).toBe(false);
    });

    it('keeps dropdown open if blur relatedTarget is inside', () => {
      render(
        <DropdownMenu label="About" href="/about-us">
          <DropdownItem label="Team" href="/about-us/structure" />
        </DropdownMenu>
      );
      const dropdownContainer = screen.getByText('About').parentElement!;
      const innerLink = screen.getByText('Team');

      fireEvent.mouseEnter(dropdownContainer);

      const menu = screen.getByText('seeLabel:{"label":"About"}').parentElement!
        .parentElement!;
      expect(menu).toHaveClass('show');

      // Blur where relatedTarget is inside the container
      fireEvent.blur(dropdownContainer, { relatedTarget: innerLink });
      expect(menu).toHaveClass('show'); // Should remain open
    });

    it('DropdownItem does not prevent default on click on desktop', () => {
      render(
        <DropdownItem label="Team" href="/about-us/structure">
          <div>Sub-child</div>
        </DropdownItem>
      );
      const itemLink = screen.getAllByRole('link', { name: /Team/i })[0];
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      fireEvent(itemLink, clickEvent);
      expect(clickEvent.defaultPrevented).toBe(false);
    });

    it('DropdownItem keeps submenu open if blur relatedTarget is inside', () => {
      render(
        <DropdownMenu label="About" href="/about-us">
          <DropdownItem label="Team" href="/about-us/structure">
            <div>Sub-child</div>
          </DropdownItem>
        </DropdownMenu>
      );

      const dropdownItem = screen.getAllByRole('link', { name: /Team/i })[0]
        .parentElement!;
      const innerElement = screen.getByText('Sub-child');

      fireEvent.mouseEnter(dropdownItem);
      const submenu = screen.getByText('seeLabel:{"label":"Team"}')
        .parentElement!.parentElement!;
      expect(submenu).toHaveClass('show');

      // Blur where relatedTarget is inside the DropdownItem
      fireEvent.blur(dropdownItem, { relatedTarget: innerElement });
      expect(submenu).toHaveClass('show');
    });
  });

  describe('Mobile behavior', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500, // Mobile
      });
    });

    it('toggles dropdown on click instead of hover', () => {
      render(
        <DropdownMenu label="About" href="/about-us">
          <DropdownItem label="Team" href="/about-us/structure" />
        </DropdownMenu>
      );

      const link = screen.getAllByRole('link', { name: /About/i })[0];
      const menu = screen.getByText('seeLabel:{"label":"About"}').parentElement!
        .parentElement!;

      expect(menu).not.toHaveClass('show');

      fireEvent.click(link);
      expect(menu).toHaveClass('show');

      fireEvent.click(link);
      expect(menu).not.toHaveClass('show');
    });

    it('DropdownItem toggles submenu on click on mobile', () => {
      render(
        <DropdownItem label="Team" href="/about-us/structure">
          <div>Sub-child</div>
        </DropdownItem>
      );

      const itemLink = screen.getAllByRole('link', { name: /Team/i })[0];
      const submenu = screen.getByText('seeLabel:{"label":"Team"}')
        .parentElement!.parentElement!;

      expect(submenu).not.toHaveClass('show');

      fireEvent.click(itemLink);
      expect(submenu).toHaveClass('show');

      // Test blur for DropdownItem
      fireEvent.focus(itemLink);
      fireEvent.blur(itemLink.parentElement!, { relatedTarget: document.body });
      expect(submenu).not.toHaveClass('show');
    });
  });
  describe('Compact layout from WCAG font scaling', () => {
    afterEach(() => {
      document.documentElement.classList.remove('compact-layout-sm');
    });

    it('acts as an accordion on a wide window when the compact layout is on', () => {
      // Wide window, but the font is scaled up so the hamburger menu is shown
      document.documentElement.classList.add('compact-layout-sm');
      render(
        <DropdownMenu label="About" href="/about-us">
          <DropdownItem label="Team" href="/about-us/structure" />
        </DropdownMenu>
      );

      const trigger = screen.getByText('About').closest('a')!;
      // Hover must not open it (touch-style menu)…
      fireEvent.mouseEnter(trigger.parentElement!);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      // …a tap toggles it instead of navigating
      const clicked = fireEvent.click(trigger);
      expect(clicked).toBe(false); // default prevented
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('links a section of a page with its localized path and hash', () => {
    render(
      <DropdownMenu label="Students" href="/student">
        <DropdownItem
          label="Consultations"
          href="/student"
          hash="consultations"
        />
      </DropdownMenu>
    );
    expect(screen.getByRole('link', { name: 'Consultations' })).toHaveAttribute(
      'href',
      '/pl/student#consultations'
    );
  });
});
