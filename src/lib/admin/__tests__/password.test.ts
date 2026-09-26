import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password';
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
