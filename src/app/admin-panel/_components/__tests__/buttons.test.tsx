import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ConfirmButton from '../ConfirmButton';
import MoveButtons from '../MoveButtons';

afterEach(() => vi.unstubAllGlobals());

describe('ConfirmButton', () => {
  const renderInForm = (onSubmit: () => void) =>
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <ConfirmButton message="Przenieść do kosza?">Usuń</ConfirmButton>
      </form>
    );

  it('submits only after the user confirms', () => {
    const onSubmit = vi.fn();
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    renderInForm(onSubmit);

    fireEvent.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(confirm).toHaveBeenCalledWith('Przenieść do kosza?');
    expect(onSubmit).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Usuń' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('looks dangerous by default and can look secondary', () => {
    const { rerender } = render(
      <ConfirmButton message="?">Usuń</ConfirmButton>
    );
    expect(screen.getByRole('button')).toHaveClass('button', 'danger');
    rerender(
      <ConfirmButton message="?" variant="secondary">
        Wyloguj
      </ConfirmButton>
    );
    expect(screen.getByRole('button')).toHaveClass('secondary');
  });
});

describe('MoveButtons', () => {
  const action = async () => {};

  it('are not shown for a single item', () => {
    const { container } = render(
      <MoveButtons
        action={action}
        idField="photoId"
        id="p1"
        index={0}
        count={1}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('send the item and the direction, disabled at the ends of the list', () => {
    const { rerender } = render(
      <MoveButtons
        action={action}
        idField="photoId"
        id="p1"
        index={0}
        count={3}
      />
    );
    const up = screen.getByRole('button', { name: 'Przesuń zdjęcie 1 wyżej' });
    const down = screen.getByRole('button', {
      name: 'Przesuń zdjęcie 1 niżej',
    });
    expect(up).toBeDisabled();
    expect(down).toBeEnabled();

    const form = down.closest('form')!;
    expect(Object.fromEntries(new FormData(form))).toEqual({
      photoId: 'p1',
      direction: 'down',
    });

    rerender(
      <MoveButtons action={action} idField="id" id="p3" index={2} count={3} />
    );
    expect(
      screen.getByRole('button', { name: 'Przesuń zdjęcie 3 wyżej' })
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Przesuń zdjęcie 3 niżej' })
    ).toBeDisabled();
  });
});
