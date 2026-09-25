import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CLIENT_NAMESPACES, pickClientMessages } from '../client-messages';

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' || entry.name === 'generated'
        ? []
        : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe('client messages', () => {
  it('include every namespace used by a client component', () => {
    const missing: string[] = [];
    for (const file of sourceFiles(path.join(process.cwd(), 'src'))) {
      const code = fs.readFileSync(file, 'utf8');
      if (!/^['"]use client['"]/m.test(code)) continue;
      for (const [, ns] of code.matchAll(/useTranslations\('([A-Za-z]+)'\)/g)) {
        if (!(CLIENT_NAMESPACES as readonly string[]).includes(ns)) {
          missing.push(`${path.relative(process.cwd(), file)}: ${ns}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps only client namespaces', () => {
    expect(
      pickClientMessages({ Navbar: { a: 'b' }, Footer: { c: 'd' } })
    ).toEqual({ Navbar: { a: 'b' } });
  });
});
