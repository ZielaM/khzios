import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { getUploadDir } from '@/lib/env';

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 2560;
export const MEDIA_PREFIX = '/media/';

/** A problem the editor can fix (wrong type, too large); shown in the form. */
export class UploadError extends Error {}

// Recognised by content, not by the file name or the browser's claim
function detectImageType(buffer: Buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'jpeg';
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

/** Readable, unguessable file name: "rada-wydzialu-3f9a1c2b7d4e.webp". */
export function mediaFileName(originalName: string, extension: string) {
  const base =
    originalName
      .replace(/\.[^.]+$/, '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'plik';
  return `${base}-${randomBytes(6).toString('hex')}.${extension}`;
}

/** Media file names accepted by the /media route and deleteMedia. */
export const MEDIA_FILE_PATTERN = /^[a-z0-9-]{1,60}-[0-9a-f]{12}\.(webp|pdf)$/;

async function store(fileName: string, data: Buffer) {
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), data, { flag: 'wx' });
  return `${MEDIA_PREFIX}${fileName}`;
}

/**
 * Saves an uploaded photo re-encoded as WebP: rotated upright, at most
 * 2560 px, without EXIF data (camera, GPS position). Returns its URL.
 */
export async function saveImage(file: File) {
  if (!file || file.size === 0) throw new UploadError('Nie wybrano zdjęcia.');
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError('Zdjęcie jest za duże (maksymalnie 15 MB).');
  }
  const input = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(input)) {
    throw new UploadError('Obsługiwane są zdjęcia JPG, PNG i WebP.');
  }

  let output: Buffer;
  try {
    output = await sharp(input, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new UploadError(
      'Nie udało się odczytać zdjęcia. Plik może być uszkodzony.'
    );
  }
  return store(mediaFileName(file.name, 'webp'), output);
}

/** Saves an uploaded PDF (checked by its signature). Returns its URL. */
export async function saveDocument(file: File) {
  if (!file || file.size === 0) throw new UploadError('Nie wybrano pliku.');
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new UploadError('Plik jest za duży (maksymalnie 20 MB).');
  }
  const data = Buffer.from(await file.arrayBuffer());
  if (data.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new UploadError('Obsługiwane są tylko pliki PDF.');
  }
  return store(mediaFileName(file.name, 'pdf'), data);
}

/** Removes an uploaded file; URLs outside /media (seed data) are left alone. */
export async function deleteMedia(url: string | null | undefined) {
  if (!url?.startsWith(MEDIA_PREFIX)) return;
  const fileName = url.slice(MEDIA_PREFIX.length);
  if (!MEDIA_FILE_PATTERN.test(fileName)) return;
  await unlink(path.join(getUploadDir(), fileName)).catch(() => undefined);
}
