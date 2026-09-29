import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { FormState } from '@/lib/admin/form';
import ActionForm from '../ActionForm';
import FormMessage from '../FormMessage';

type Action = (state: FormState, data: FormData) => Promise<FormState>;

function renderForm(action: Action) {
  render(
    <ActionForm action={action} submitLabel="Zapisz">
      <input aria-label="Tytuł" name="title" defaultValue="Stary tytuł" />
      <input aria-label="Szkic" name="note" defaultValue="z serwera" disabled />
      <input aria-label="Bez nazwy" defaultValue="" />
      <input type="hidden" name="id" defaultValue="n1" />
      <input aria-label="Zdjęcie" type="file" name="photo" />
      <label>
        <input type="checkbox" name="tags" value="a" defaultChecked /> A
      </label>
      <label>
        <input type="checkbox" name="tags" value="b" /> B
      </label>
      <label>
        <input type="radio" name="kind" value="x" defaultChecked /> X
      </label>
      <label>
        <input type="radio" name="kind" value="y" /> Y
      </label>
      <select aria-label="Rola" name="role" defaultValue="EDITOR">
        <option value="EDITOR">Redaktor</option>
        <option value="ADMIN">Administrator</option>
      </select>
      <textarea aria-label="Treść" name="body" defaultValue="" />
      <textarea aria-label="Uwagi" defaultValue="" />
    </ActionForm>
  );
}

const edit = () => {
  fireEvent.change(screen.getByLabelText('Tytuł'), {
    target: { value: 'Nowy tytuł' },
  });
  fireEvent.click(screen.getByLabelText('A'));
  fireEvent.click(screen.getByLabelText('B'));
  fireEvent.click(screen.getByLabelText('Y'));
  fireEvent.change(screen.getByLabelText('Rola'), {
    target: { value: 'ADMIN' },
  });
  fireEvent.change(screen.getByLabelText('Treść'), {
    target: { value: 'Treść artykułu' },
  });
  fireEvent.change(screen.getByLabelText('Bez nazwy'), {
    target: { value: 'nie wysłane' },
  });
};
const submit = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

describe('ActionForm', () => {
  it('keeps what was typed when the server rejects it', async () => {
    const action = vi.fn<Action>(async () => ({
      error: 'Tytuł jest za długi.',
    }));
    renderForm(action);
    edit();
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tytuł jest za długi.'
    );
    const [, data] = action.mock.calls[0];
    expect(data.get('title')).toBe('Nowy tytuł');
    expect(screen.getByLabelText('Tytuł')).toHaveValue('Nowy tytuł');
    expect(screen.getByLabelText('A')).not.toBeChecked();
    expect(screen.getByLabelText('B')).toBeChecked();
    expect(screen.getByLabelText('Y')).toBeChecked();
    expect(screen.getByLabelText('Rola')).toHaveValue('ADMIN');
    expect(screen.getByLabelText('Treść')).toHaveValue('Treść artykułu');
    // Not submitted, so not restored: the reset's values stay
    expect(screen.getByLabelText('Szkic')).toHaveValue('z serwera');
    expect(screen.getByLabelText('Bez nazwy')).toHaveValue('');
  });

  it('clears the form after a successful save and confirms it', async () => {
    renderForm(async () => ({ message: 'Zapisano.' }));
    edit();
    submit();

    expect(await screen.findByRole('status')).toHaveTextContent('Zapisano.');
    expect(screen.getByLabelText('Tytuł')).toHaveValue('Stary tytuł');
    expect(screen.getByLabelText('A')).toBeChecked();
  });

  it('shows "saving" and no old message while the action runs', async () => {
    let finish!: (state: FormState) => void;
    const pending = new Promise<FormState>((resolve) => (finish = resolve));
    const action = vi
      .fn<Action>()
      .mockResolvedValueOnce({ message: 'Zapisano.' })
      .mockReturnValueOnce(pending);
    renderForm(action);

    submit();
    await screen.findByRole('status');
    submit();
    const button = await screen.findByRole('button', { name: 'Zapisywanie…' });
    expect(button).toBeDisabled();
    expect(screen.queryByRole('status')).toBeNull();

    await act(async () => finish({ message: 'Zapisano ponownie.' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Zapisano ponownie.'
    );
    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();
  });

  it('shows a temporary password once, with a message that does not fade', async () => {
    renderForm(async () => ({
      message: 'Utworzono konto.',
      password: 'abcd-efgh',
    }));
    submit();
    const message = await screen.findByRole('status');
    expect(message).not.toHaveClass('fading');
    expect(screen.getByText('abcd-efgh').tagName).toBe('CODE');
  });

  it('lists new recovery codes', async () => {
    renderForm(async () => ({ recoveryCodes: ['aaaaa-11111', 'bbbbb-22222'] }));
    submit();
    await waitFor(() =>
      expect(
        screen.getAllByRole('listitem').map((li) => li.textContent)
      ).toEqual(['aaaaa-11111', 'bbbbb-22222'])
    );
  });
});

describe('ActionForm layout', () => {
  it('can take the full width for long forms', () => {
    const { container } = render(
      <ActionForm action={async () => ({})} submitLabel="Zapisz" wide>
        <input name="x" />
      </ActionForm>
    );
    expect(container.querySelector('form')).toHaveClass('form', 'wideForm');
  });
});

describe('FormMessage', () => {
  it('fades a confirmation out and then removes it', () => {
    render(<FormMessage message="Zapisano." />);
    const message = screen.getByRole('status');
    expect(message).toHaveClass('fading');
    // jsdom has no AnimationEvent, so React listens for the prefixed name
    fireEvent(message, new Event('webkitAnimationEnd', { bubbles: true }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps errors, which are announced as alerts', () => {
    render(<FormMessage error="Błąd" message="Zapisano." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Błąd');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders nothing without a message', () => {
    const { container } = render(<FormMessage />);
    expect(container).toBeEmptyDOMElement();
  });
});
