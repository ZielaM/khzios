import { describe, it, expect } from 'vitest';
import { getDummyHash, hashPassword, verifyPassword } from '../password';
import { defaultMessages } from '../default-messages';
import { passwordProblem } from '../password-rules';

describe('passwords', () => {
  it('verifies an argon2id hash', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'correct horse battery')).toBe(true);
    expect(await verifyPassword(hash, 'wrong horse battery')).toBe(false);
    expect(await verifyPassword('not a hash', 'x')).toBe(false);
  });

  it('only checks the length', () => {
    expect(passwordProblem('short')).toMatch(/co najmniej 12/);
    expect(passwordProblem('dwanaście zn')).toBeNull();
    expect(passwordProblem('x'.repeat(129))).toMatch(/najwyżej 128/);
  });
});

describe('getDummyHash', () => {
  it('is one real hash, reused, that no password matches', async () => {
    const hash = await getDummyHash();
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await getDummyHash()).toBe(hash);
    expect(await verifyPassword(hash, 'dev-password-123')).toBe(false);
  });
});

describe('default texts', () => {
  it('holds the same sections of text in every language', () => {
    const sections = Object.keys(defaultMessages.pl).sort();
    for (const locale of ['en', 'uk', 'ru'] as const) {
      expect(Object.keys(defaultMessages[locale]).sort()).toEqual(sections);
    }
  });
});
