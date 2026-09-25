import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getSectionImages,
  getSectionImage,
  IMAGE_SECTIONS,
} from '../site-images';

let root: string;

function addFiles(section: string, files: Record<string, string>) {
  const dir = path.join(root, 'public', 'images', ...section.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-images-'));
  vi.spyOn(process, 'cwd').mockReturnValue(root);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

describe('getSectionImages', () => {
  it('returns an empty array when the folder does not exist', () => {
    expect(getSectionImages('hero', 'pl')).toEqual([]);
  });

  it('lists only image files, sorted by name with numeric awareness', () => {
    addFiles('hero', {
      '10-late.jpg': '',
      '2-middle.webp': '',
      '1-first.PNG': '',
      'notes.txt': '',
      '.DS_Store': '',
      'alt.json': '{}',
    });

    expect(getSectionImages('hero', 'pl').map((i) => i.src)).toEqual([
      '/images/hero/1-first.PNG',
      '/images/hero/2-middle.webp',
      '/images/hero/10-late.jpg',
    ]);
  });

  it('URL-encodes filenames', () => {
    addFiles('hero', { 'zdjęcie 1.jpg': '' });
    expect(getSectionImages('hero', 'pl')[0].src).toBe(
      '/images/hero/zdj%C4%99cie%201.jpg'
    );
  });

  it('resolves alt text for the locale from alt.json', () => {
    addFiles('hero', {
      'a.jpg': '',
      'alt.json': JSON.stringify({ 'a.jpg': { pl: 'Obora', en: 'Barn' } }),
    });

    expect(getSectionImages('hero', 'en')[0].alt).toBe('Barn');
    expect(getSectionImages('hero', 'pl')[0].alt).toBe('Obora');
  });

  it('follows the translation fallback chain for missing languages', () => {
    addFiles('hero', {
      'a.jpg': '',
      'b.jpg': '',
      'alt.json': JSON.stringify({
        'a.jpg': { pl: 'Obora', en: 'Barn' },
        'b.jpg': { pl: 'Tylko po polsku' },
      }),
    });

    const [a, b] = getSectionImages('hero', 'uk');
    expect(a.alt).toBe('Barn');
    expect(b.alt).toBe('Tylko po polsku');
  });

  it('uses the fallback alt for files without an entry', () => {
    addFiles('hero', { 'a.jpg': '' });
    expect(getSectionImages('hero', 'pl', 'Katedra')[0].alt).toBe('Katedra');
  });

  it('ignores a malformed alt.json instead of failing', () => {
    addFiles('hero', { 'a.jpg': '', 'alt.json': '{ not json' });
    expect(getSectionImages('hero', 'pl', 'fallback')).toEqual([
      { src: '/images/hero/a.jpg', alt: 'fallback' },
    ]);
  });

  it('rejects section names that could escape the images folder', () => {
    addFiles('hero', { 'a.jpg': '' });
    expect(getSectionImages('../hero', 'pl')).toEqual([]);
    expect(getSectionImages(IMAGE_SECTIONS.team('../../x'), 'pl')).toEqual([]);
  });
});

describe('getSectionImage', () => {
  it('returns the first image of a team folder', () => {
    addFiles(IMAGE_SECTIONS.team('poultry'), { 'b.jpg': '', 'a.jpg': '' });
    expect(getSectionImage(IMAGE_SECTIONS.team('poultry'), 'pl')).toEqual({
      src: '/images/teams/poultry/a.jpg',
      alt: '',
    });
  });

  it('returns null when the section has no images', () => {
    expect(getSectionImage(IMAGE_SECTIONS.team('swine'), 'pl')).toBeNull();
  });
});
