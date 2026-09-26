import { describe, it, expect } from 'vitest';
import {
  currentTotp,
  findRecoveryCode,
  generateRecoveryCodes,
  generateTotpSecret,
  totpUri,
  verifyTotp,
} from '../totp';

describe('TOTP', () => {
  it('accepts the current code and rejects others', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, 'jan', currentTotp(secret, 'jan'))).toBe(true);
    expect(verifyTotp(secret, 'jan', '12345')).toBe(false);
    expect(verifyTotp(secret, 'jan', 'abcdef')).toBe(false);
  });

  it('builds an otpauth URI with the issuer and login', () => {
    const uri = totpUri(generateTotpSecret(), 'jan');
    expect(uri).toMatch(/^otpauth:\/\/totp\/KHZiOS:jan\?/);
  });
});

describe('recovery codes', () => {
  it('stores only hashes and matches codes regardless of case and dashes', () => {
    const { codes, hashes } = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(hashes.some((h) => codes.includes(h))).toBe(false);
    expect(
      findRecoveryCode(hashes, codes[3].toUpperCase().replace('-', ''))
    ).toBe(3);
    expect(findRecoveryCode(hashes, 'aaaaa-bbbbb')).toBe(-1);
  });
});
