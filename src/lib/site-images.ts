/**
 * Folder-based site imagery.
 *
 * Photos are never referenced by filename in code. Each section of the site
 * reads whatever files are placed in its folder under `public/images/`:
 *
 *   public/images/hero/            → home page cross-fade (all files)
 *   public/images/about-us/        → "About us" hero background (first file)
 *   public/images/student/         → student zone banner (first file)
 *   public/images/contact/         → building photo next to the map (first file)
 *   public/images/teams/<slug>/    → team banner, structure card thumbnail
 *                                    and share image (first file)
 *
 * Files are ordered by name (numeric-aware), so prefixing them with
 * `01-`, `02-` controls the order. Alt texts live in an optional `alt.json`
 * next to the photos, keyed by filename and then by language:
 *
 *   { "01-obora.jpg": { "pl": "Krowy w oborze", "en": "Cows in the barn" } }
 *
 * Missing languages fall back along the same chain as DB translations.
 */

import fs from 'fs';
import path from 'path';
import { FALLBACK_CHAIN } from '@/lib/translations';
import { LanguageCode } from '@/types/search-types';
import { createLogger } from '@/lib/logger';

const log = createLogger('site-images');

const IMAGES_DIR = 'images';
const ALT_FILE = 'alt.json';
const SUPPORTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
]);

/** Section folders are code-defined or DB slugs — never allow path escapes */
const SECTION_PATTERN = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export const IMAGE_SECTIONS = {
  hero: 'hero',
  aboutUs: 'about-us',
  student: 'student',
  contact: 'contact',
  team: (slug: string) => `teams/${slug}`,
} as const;

export interface SiteImage {
  /** Public URL path, e.g. `/images/hero/01-obora.jpg` */
  src: string;
  alt: string;
}

type AltMap = Record<string, Partial<Record<LanguageCode, string>>>;

function sectionDir(section: string): string {
  return path.join(process.cwd(), 'public', IMAGES_DIR, ...section.split('/'));
}

function readAltMap(dir: string, section: string): AltMap {
  const file = path.join(dir, ALT_FILE);
  if (!fs.existsSync(file)) return {};

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return parsed && typeof parsed === 'object' ? (parsed as AltMap) : {};
  } catch (err) {
    log.warn({ err, section }, 'Invalid alt.json — ignoring alt texts');
    return {};
  }
}

function resolveAlt(
  alts: AltMap[string] | undefined,
  locale: string,
  fallbackAlt: string
): string {
  if (!alts) return fallbackAlt;

  const chain = FALLBACK_CHAIN[locale as LanguageCode] ?? FALLBACK_CHAIN.en;
  for (const lang of chain) {
    const alt = alts[lang];
    if (typeof alt === 'string' && alt.trim()) return alt;
  }
  return fallbackAlt;
}

/**
 * Returns every image in a section folder, sorted by filename.
 * Returns an empty array when the folder does not exist, so a section
 * without photos simply renders its photo-less variant.
 *
 * @param fallbackAlt - used for files without an entry in `alt.json`
 */
export function getSectionImages(
  section: string,
  locale: string,
  fallbackAlt: string = ''
): SiteImage[] {
  if (!SECTION_PATTERN.test(section)) {
    log.warn({ section }, 'Rejected invalid image section name');
    return [];
  }

  const dir = sectionDir(section);
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        !entry.name.startsWith('.') &&
        SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  if (files.length === 0) return [];

  const altMap = readAltMap(dir, section);

  return files.map((file) => ({
    src: `/${IMAGES_DIR}/${section}/${encodeURIComponent(file)}`,
    alt: resolveAlt(altMap[file], locale, fallbackAlt),
  }));
}

/** Returns the first image of a section, or null when it has none. */
export function getSectionImage(
  section: string,
  locale: string,
  fallbackAlt: string = ''
): SiteImage | null {
  return getSectionImages(section, locale, fallbackAlt)[0] ?? null;
}
