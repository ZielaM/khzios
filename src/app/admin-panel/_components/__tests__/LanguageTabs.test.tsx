import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LanguageTabs, { type LanguagePanel } from '../LanguageTabs';

const panels = (
  overrides: Partial<Record<string, Partial<LanguagePanel>>> = {}
) =>
  [
    ['pl', 'Polski'],
    ['en', 'Angielski'],
    ['uk', 'Ukraiński'],
  ].map(([code, label]) => ({
    code,
    label,
    filled: false,
    content: <input aria-label={`Tytuł ${code}`} name={`title_${code}`} />,
    ...overrides[code],
  }));

const tab = (name: string) =>
  screen.getByRole('tab', { name: new RegExp(`^${name}`) });
const nextTask = () => act(() => new Promise((resolve) => setTimeout(resolve)));

describe('LanguageTabs', () => {
  it('shows one language at a time and marks the required and filled ones', () => {
    render(
      <LanguageTabs panels={panels({ pl: { required: true, filled: true } })} />
    );
    expect(tab('Polski')).toHaveTextContent('Polski *uzupełnione');
    expect(tab('Angielski')).toHaveTextContent('Angielskibrak');
    expect(tab('Polski')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Tytuł pl')).toBeVisible();
    // Hidden panels stay in the form, so every language is submitted
    expect(screen.getByLabelText('Tytuł en')).not.toBeVisible();

    fireEvent.click(tab('Angielski'));
    expect(screen.getByLabelText('Tytuł en')).toBeVisible();
    expect(screen.getByLabelText('Tytuł pl')).not.toBeVisible();
  });

  it('moves between tabs with the arrow keys, wrapping around', () => {
    render(<LanguageTabs panels={panels()} />);
    const list = screen.getByRole('tablist');
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(tab('Ukraiński')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Ukraiński')).toHaveFocus();
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(tab('Polski')).toHaveFocus();
    fireEvent.keyDown(list, { key: 'Enter' });
    expect(tab('Polski')).toHaveAttribute('aria-selected', 'true');
  });

  it('updates "uzupełnione" and "brak" while typing, also in the article editor', () => {
    render(
      <LanguageTabs
        panels={panels({
          en: {
            content: (
              <div
                aria-label="Edytor"
                contentEditable
                suppressContentEditableWarning
              />
            ),
          },
        })}
      />
    );
    const title = screen.getByLabelText('Tytuł pl');
    fireEvent.input(title, { target: { value: 'Krowy' } });
    expect(tab('Polski')).toHaveTextContent('uzupełnione');
    fireEvent.input(title, { target: { value: 'Krowy i owce' } });
    expect(tab('Polski')).toHaveTextContent('uzupełnione');
    fireEvent.input(title, { target: { value: '   ' } });
    expect(tab('Polski')).toHaveTextContent('brak');

    const editor = screen.getByLabelText('Edytor');
    editor.textContent = 'Cows';
    fireEvent.input(editor);
    expect(tab('Angielski')).toHaveTextContent('uzupełnione');
  });

  it('opens the tab of the first invalid field when the form is submitted', async () => {
    render(
      <form>
        <LanguageTabs
          panels={panels({
            en: {
              content: <input aria-label="Tytuł en" name="title_en" required />,
            },
            uk: {
              content: <input aria-label="Tytuł uk" name="title_uk" required />,
            },
          })}
        />
      </form>
    );
    const form = screen.getByLabelText('Tytuł en').closest('form')!;
    form.checkValidity();
    expect(tab('Angielski')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Tytuł en')).toBeVisible();

    // A later check starts over
    await nextTask();
    fireEvent.input(screen.getByLabelText('Tytuł en'), {
      target: { value: 'Cows' },
    });
    form.checkValidity();
    expect(tab('Ukraiński')).toHaveAttribute('aria-selected', 'true');
  });

  it('ignores invalid fields outside its own panels', () => {
    render(
      <form>
        <input aria-label="Login" name="login" required />
        <LanguageTabs panels={panels()} />
        <LanguageTabs
          panels={panels({
            en: { content: <input aria-label="Inne" name="x" required /> },
          })}
        />
      </form>
    );
    const form = screen.getByLabelText('Login').closest('form')!;
    form.checkValidity();
    for (const selected of screen.getAllByRole('tab', { selected: true })) {
      expect(selected).toHaveTextContent(/^Polski/);
    }
  });

  it('recounts the filled languages when the form is cleared', async () => {
    render(
      <form>
        <LanguageTabs panels={panels({ pl: { filled: true } })} />
      </form>
    );
    const form = screen.getByLabelText('Tytuł pl').closest('form')!;
    form.reset();
    await nextTask();
    expect(tab('Polski')).toHaveTextContent('brak');
  });
});
