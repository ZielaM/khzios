import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getUploadDir } from '@/lib/env';
import { MEDIA_FILE_PATTERN } from '@/lib/admin/storage';

// Files uploaded in the admin panel. They live outside public/, which
// `next start` only serves as it was at build time.

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  // The pattern also rules out path traversal ("..", "/")
  if (!MEDIA_FILE_PATTERN.test(file)) {
    return new Response('Not found', { status: 404 });
  }

  let data: Buffer;
  try {
    data = await readFile(path.join(getUploadDir(), file));
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const extension = file.split('.').pop()!;
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': CONTENT_TYPES[extension],
      // Names are unique per upload, so a file never changes
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
