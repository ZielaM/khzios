// Fails when a stylesheet or component uses a CSS custom property that is
// never defined. An undefined var() makes the whole declaration invalid, so
// borders or colours silently disappear instead of producing an error.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', 'src');
// Defined outside the stylesheets: next/font and runtime scripts
const EXTERNAL = new Set(['--font-sans', '--font-serif']);

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name === 'generated' ? [] : files(full);
    return /\.(scss|tsx?)$/.test(entry.name) ? [full] : [];
  });
}

const defined = new Set(EXTERNAL);
const used = new Map();

for (const file of files(ROOT)) {
  const code = fs.readFileSync(file, 'utf8');
  for (const [, name] of code.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g))
    defined.add(name);
  for (const [, name] of code.matchAll(
    /setProperty\(\s*['"](--[a-zA-Z0-9-]+)/g
  ))
    defined.add(name);
  for (const [, name] of code.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    if (!used.has(name)) used.set(name, new Set());
    used.get(name).add(path.relative(process.cwd(), file));
  }
}

const missing = [...used].filter(([name]) => !defined.has(name));
if (missing.length > 0) {
  console.error('Undefined CSS custom properties:');
  for (const [name, where] of missing)
    console.error(`  ${name}: ${[...where].join(', ')}`);
  process.exit(1);
}
console.log(`CSS custom properties OK (${used.size} used, all defined)`);
