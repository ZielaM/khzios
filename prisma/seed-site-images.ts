import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

// Example photos for development: the folders in public/images (with an
// optional alt.json: { "<file>": { "pl": "...", "en": "..." } }). In
// production, section photos are uploaded in the admin panel.
const ROOT = path.join(process.cwd(), 'public', 'images');
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const LANGUAGES = ['pl', 'en', 'uk', 'ru'] as const;

function sections(dir = ROOT, prefix = ''): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];
    const section = prefix ? `${prefix}/${entry.name}` : entry.name;
    return [section, ...sections(path.join(dir, entry.name), section)];
  });
}

export async function seedSiteImages() {
  console.log('Zdjęcia sekcji...');
  await prisma.siteImage.deleteMany();

  for (const section of sections()) {
    const dir = path.join(ROOT, ...section.split('/'));
    const files = fs
      .readdirSync(dir)
      .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    if (files.length === 0) continue;

    const altFile = path.join(dir, 'alt.json');
    const alts: Record<
      string,
      Partial<Record<(typeof LANGUAGES)[number], string>>
    > = fs.existsSync(altFile)
      ? JSON.parse(fs.readFileSync(altFile, 'utf-8'))
      : {};

    for (const [index, file] of files.entries()) {
      await prisma.siteImage.create({
        data: {
          section,
          url: `/images/${section}/${encodeURIComponent(file)}`,
          displayOrder: index,
          translations: {
            create: LANGUAGES.filter((lang) => alts[file]?.[lang]).map(
              (lang) => ({
                languageCode: lang,
                alt: alts[file]![lang]!,
              })
            ),
          },
        },
      });
    }
  }
}
