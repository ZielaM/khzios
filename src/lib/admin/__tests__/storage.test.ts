import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {
  MEDIA_FILE_PATTERN,
  mediaFileName,
  saveDocument,
  saveImage,
  UploadError,
  deleteMedia,
} from '../storage';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'khz-upload-'));
  vi.stubEnv('UPLOAD_DIR', dir);
});

const file = (data: Buffer, name: string) =>
  new File([new Uint8Array(data)], name);

describe('uploads', () => {
  it('builds readable, unguessable names', () => {
    const name = mediaFileName('Rada Wydziału 2026.JPG', 'webp');
    expect(name).toMatch(/^rada-wydzialu-2026-[0-9a-f]{12}\.webp$/);
    expect(MEDIA_FILE_PATTERN.test(name)).toBe(true);
  });

  it('re-encodes photos as WebP without metadata', async () => {
    const jpeg = await sharp({
      create: { width: 4000, height: 3000, channels: 3, background: '#1b5e3b' },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Artist: 'someone' } } })
      .toBuffer();
    const url = await saveImage(file(jpeg, 'photo.jpg'));

    expect(url).toMatch(/^\/media\/photo-[0-9a-f]{12}\.webp$/);
    const [stored] = await readdir(dir);
    const meta = await sharp(path.join(dir, stored)).metadata();
    expect(meta.format).toBe('webp');
    expect(Math.max(meta.width!, meta.height!)).toBe(2560);
    expect(meta.exif).toBeUndefined();
  });

  it('rejects files that are not photos or PDFs by their content', async () => {
    const fake = file(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      'x.jpg'
    );
    await expect(saveImage(fake)).rejects.toBeInstanceOf(UploadError);
    await expect(
      saveDocument(file(Buffer.from('hello'), 'x.pdf'))
    ).rejects.toBeInstanceOf(UploadError);
    await expect(
      saveDocument(file(Buffer.from('%PDF-1.7\n'), 'Sylabus.pdf'))
    ).resolves.toMatch(/^\/media\/sylabus-[0-9a-f]{12}\.pdf$/);
  });
});

const png = () =>
  sharp({ create: { width: 40, height: 30, channels: 3, background: '#123' } })
    .png()
    .toBuffer();
const MB = 1024 * 1024;

describe('more uploads', () => {
  it('accepts PNG and WebP photos too', async () => {
    const fromPng = await saveImage(file(await png(), 'wykres.png'));
    const webp = await sharp(await png())
      .webp()
      .toBuffer();
    const fromWebp = await saveImage(file(webp, 'wykres.webp'));
    expect([fromPng, fromWebp]).toEqual([
      expect.stringMatching(/^\/media\/wykres-[0-9a-f]{12}\.webp$/),
      expect.stringMatching(/^\/media\/wykres-[0-9a-f]{12}\.webp$/),
    ]);
  });

  it('explains empty, oversized and damaged files', async () => {
    const empty = new File([], 'x.jpg');
    await expect(saveImage(empty)).rejects.toThrow('Nie wybrano zdjęcia.');
    await expect(saveDocument(empty)).rejects.toThrow('Nie wybrano pliku.');
    await expect(
      saveImage(new File([new Uint8Array(15 * MB + 1)], 'x.jpg'))
    ).rejects.toThrow('za duże');
    await expect(
      saveDocument(new File([new Uint8Array(20 * MB + 1)], 'x.pdf'))
    ).rejects.toThrow('za duży');
    // A JPEG signature followed by garbage
    const broken = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(64, 7),
    ]);
    await expect(saveImage(file(broken, 'x.jpg'))).rejects.toThrow(
      'uszkodzony'
    );
    expect(await readdir(dir)).toEqual([]);
  });

  it('names a file without letters "plik"', () => {
    expect(mediaFileName('???.pdf', 'pdf')).toMatch(/^plik-[0-9a-f]{12}\.pdf$/);
  });
});

describe('deleteMedia', () => {
  it('removes an uploaded file', async () => {
    const url = await saveImage(file(await png(), 'a.png'));
    await deleteMedia(url);
    expect(await readdir(dir)).toEqual([]);
  });

  it('leaves anything outside the upload folder alone', async () => {
    const url = await saveImage(file(await png(), 'a.png'));
    for (const other of [
      null,
      '/images/hero/01.jpg',
      '/media/../../etc/passwd',
      '/media/nie-istnieje-0123456789ab.webp',
    ]) {
      await expect(deleteMedia(other)).resolves.toBeUndefined();
    }
    expect(await readdir(dir)).toEqual([url.split('/').pop()]);
  });
});
