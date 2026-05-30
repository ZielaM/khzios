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
    });
  });
});
