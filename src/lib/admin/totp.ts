import { createHash, randomBytes } from 'node:crypto';
import { Secret, TOTP } from 'otpauth';

const ISSUER = 'KHZiOS';

function totpFor(secret: string, login: string) {
  return new TOTP({
    issuer: ISSUER,
    label: login,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

export function generateTotpSecret() {
  return new Secret({ size: 20 }).base32;
}

/** otpauth:// URI for the QR code scanned by an authenticator app. */
export function totpUri(secret: string, login: string) {
  return totpFor(secret, login).toString();
}

/** Accepts the current code and one step either side (clock drift). */
export function verifyTotp(secret: string, login: string, code: string) {
  const token = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) return false;
  return totpFor(secret, login).validate({ token, window: 1 }) !== null;
}

export function currentTotp(secret: string, login: string) {
  return totpFor(secret, login).generate();
}

const hashCode = (code: string) =>
  createHash('sha256')
    .update(code.toLowerCase().replace(/[\s-]/g, ''))
    .digest('hex');

/** Ten one-time codes for a lost phone; only their hashes are stored. */
export function generateRecoveryCodes() {
  const codes = Array.from({ length: 10 }, () => {
    const raw = randomBytes(5).toString('hex');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  return { codes, hashes: codes.map(hashCode) };
}

/** Index of the matching recovery code hash, or -1. */
export function findRecoveryCode(hashes: string[], code: string) {
  return hashes.indexOf(hashCode(code));
}
