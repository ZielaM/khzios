#!/usr/bin/env node
/**
 * Checks a running `next start` for the image optimizer hang fixed upstream
 * in vercel/next.js#98168 (issue #96538): a visitor who leaves while a local
 * image is being optimized makes that /_next/image URL hang for everyone
 * until the server restarts.
 *
 * Each attempt uses a size the server has not optimized yet, cancels the
 * request after a few milliseconds and then asks for the same URL again.
 * Without the fix the second request never gets an answer.
 *
 *   pnpm build && pnpm start                  # in one terminal
 *   node scripts/check-image-abort.mjs        # in another
 *   node scripts/check-image-abort.mjs http://localhost:3000 /images/hero/02-przyklad-las.jpg
 *
 * Exit code 0: not affected; 1: hang reproduced; 2: could not test.
 * Restart the server before a second run: optimized sizes are cached.
 */

const base = process.argv[2] ?? 'http://localhost:3000';
const image = process.argv[3] ?? '/images/hero/02-przyklad-las.jpg';

// Next's default image sizes; the WebP and original variants of one size
// are cached separately, so each size gives two cold URLs
const WIDTHS = [
  32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840,
];
const ACCEPT = ['image/webp,*/*', '*/*'];
const ABORT_AFTER_MS = [1, 3, 5, 10, 20, 40];
const ANSWER_TIMEOUT_MS = 15_000;

const url = (width) =>
  `${base}/_next/image?url=${encodeURIComponent(image)}&w=${width}&q=75`;

async function attempt(width, accept, abortAfter) {
  const headers = { accept };
  const cancelled = new AbortController();
  const first = fetch(url(width), { headers, signal: cancelled.signal })
    .then((r) => r.arrayBuffer())
    .catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, abortAfter));
  cancelled.abort();
  await first;

  try {
    const second = await fetch(url(width), {
      headers,
      signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS),
    });
    await second.arrayBuffer();
    return second.status;
  } catch (error) {
    if (error.name === 'TimeoutError') return 'hang';
    throw error;
  }
}

// Any answer will do; an image URL would warm one of the sizes under test
const probe = await fetch(base, { method: 'HEAD' }).catch((error) => error);
if (probe instanceof Error) {
  console.error(`Cannot reach ${base}: ${probe.message}`);
  process.exit(2);
}

let tested = 0;
for (const accept of ACCEPT) {
  for (const [i, width] of WIDTHS.entries()) {
    const abortAfter = ABORT_AFTER_MS[i % ABORT_AFTER_MS.length];
    const result = await attempt(width, accept, abortAfter);
    const label = `w=${width}, Accept: ${accept}, cancelled after ${abortAfter} ms`;
    if (result === 'hang') {
      console.log(`HANG  ${label}`);
      console.log(
        `\nThe bug is present: the URL above no longer answers. Keep the patch.`
      );
      process.exit(1);
    }
    if (result === 200) tested++;
    console.log(`${result === 200 ? 'ok   ' : `${result}  `} ${label}`);
  }
}

if (tested === 0) {
  console.error(`\nNo attempt got an image back; check the image path.`);
  process.exit(2);
}
console.log(
  `\nNo hang in ${tested} attempts: this Next version is not affected.`
);
