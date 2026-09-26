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
