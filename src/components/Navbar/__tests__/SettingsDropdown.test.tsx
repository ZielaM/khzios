import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SettingsDropdown from '../SettingsDropdown';

describe('SettingsDropdown', () => {
  it('toggles children visibility when button is clicked', () => {
    render(
      <SettingsDropdown label="Settings">
        <div>Settings Content</div>
      </SettingsDropdown>
    );

    const button = screen.getByRole('button', { name: 'Settings' });
    const panel = screen.getByRole('group', { name: 'Settings' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toHaveClass('show');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveClass('show');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toHaveClass('show');
  });
});
