import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LocationMap from '../LocationMap';

describe('LocationMap', () => {
  it('does not contact Google until the visitor asks for the map', () => {
    render(<LocationMap />);

    expect(screen.queryByTitle('mapTitle')).not.toBeInTheDocument();
    expect(screen.getByText('mapNotice')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /mapOpenExternal/ })
    ).toHaveAttribute('target', '_blank');

    fireEvent.click(screen.getByRole('button', { name: 'mapShow' }));

    const iframe = screen.getByTitle('mapTitle');
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('google.com/maps/embed')
    );
    expect(iframe).toHaveFocus();
  });
});
