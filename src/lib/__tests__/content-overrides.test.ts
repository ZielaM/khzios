import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  isEditableKey,
  textProblem,
  withContentOverrides,
} from '../content-overrides';

vi.mock('@/lib/prisma', () => ({
  prisma: { contentOverride: { findMany: vi.fn() } },
}));

describe('page text overrides', () => {
  it('only allows the listed keys', () => {
    expect(isEditableKey('AboutUsPage.overview')).toBe(true);
    expect(isEditableKey('HomePage.heroTitle')).toBe(true);
    expect(isEditableKey('HomePage.statTeams')).toBe(false);
    expect(isEditableKey('Navbar.news')).toBe(false);
  });

  it('keeps the tags and variables of the default text', () => {
    const def = 'Zobacz <link>stronę</link> z dnia {date}.';
    expect(textProblem(def, 'Patrz <link>tutaj</link>, {date}.')).toBeNull();
    expect(textProblem(def, 'Bez linku {date}.')).toMatch(/Zachowaj znaczniki/);
    expect(textProblem(def, 'Zobacz <link>stronę z dnia {date}.')).toMatch(
      /zamknięty/
    );
    expect(textProblem(def, 'Zobacz <link>stronę</link>.')).toMatch(
      /Zachowaj zmienne/
    );
    expect(textProblem('Zwykły tekst', 'Tekst z {x}')).toMatch(/klamrowych/);
    expect(textProblem('Zwykły tekst', '   ')).toMatch(/pusty/);
  });

  it('merges stored texts into the messages', async () => {
    vi.mocked(prisma.contentOverride.findMany).mockResolvedValue([
      { key: 'AboutUsPage.overview', value: 'Nowy opis' },
      { key: 'Navbar.news', value: 'Ignorowane' },
    ] as never);
    const messages = {
      AboutUsPage: { overview: 'Stary', title: 'O nas' },
      Navbar: { news: 'Aktualności' },
    };
    const merged = await withContentOverrides(messages, 'pl');
    expect(merged).toEqual({
      AboutUsPage: { overview: 'Nowy opis', title: 'O nas' },
      Navbar: { news: 'Aktualności' },
    });
    // The defaults themselves are not changed
    expect(messages.AboutUsPage.overview).toBe('Stary');
  });

  it('falls back to the defaults when the database fails', async () => {
    vi.mocked(prisma.contentOverride.findMany).mockRejectedValue(
      new Error('down')
    );
    const messages = { AboutUsPage: { overview: 'Stary' } };
    expect(await withContentOverrides(messages, 'pl')).toBe(messages);
  });
});
