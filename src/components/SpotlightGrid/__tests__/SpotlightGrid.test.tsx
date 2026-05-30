import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SpotlightGrid from '../SpotlightGrid';

describe('SpotlightGrid', () => {
  it('updates CSS variables on mouse move', () => {
    render(
      <SpotlightGrid className="grid-container">
        <div data-testid="card-1">Card 1</div>
        <div data-testid="card-2">Card 2</div>
      </SpotlightGrid>
    );

    const container = screen.getByText('Card 1').parentElement!;

    // Mock getBoundingClientRect for children
    const card1 = screen.getByTestId('card-1');
    const card2 = screen.getByTestId('card-2');

    card1.getBoundingClientRect = () => ({
      left: 10,
      top: 10,
      right: 110,
      bottom: 110,
      width: 100,
      height: 100,
      x: 10,
      y: 10,
      toJSON: () => {},
    });

    card2.getBoundingClientRect = () => ({
      left: 120,
      top: 10,
      right: 220,
      bottom: 110,
      width: 100,
      height: 100,
      x: 120,
      y: 10,
      toJSON: () => {},
    });

    fireEvent.mouseMove(container, { clientX: 50, clientY: 50 });

    expect(card1.style.getPropertyValue('--mouse-x')).toBe('40px'); // 50 - 10
    expect(card1.style.getPropertyValue('--mouse-y')).toBe('40px'); // 50 - 10

    expect(card2.style.getPropertyValue('--mouse-x')).toBe('-70px'); // 50 - 120
    expect(card2.style.getPropertyValue('--mouse-y')).toBe('40px'); // 50 - 10
  });

  it('renders children with provided className', () => {
    render(
      <SpotlightGrid className="custom-grid">
        <span>Child</span>
      </SpotlightGrid>
    );

    const child = screen.getByText('Child');
    expect(child.parentElement).toHaveClass('custom-grid');
  });
});
