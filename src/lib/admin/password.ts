import { hash, verify } from '@node-rs/argon2';
export { passwordProblem } from './password-rules';

// argon2id with the OWASP-recommended minimum (19 MiB, 2 iterations)
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// A hash of a random password: verifying against it when the login does not
// exist takes as long as a real check, so timing does not reveal accounts
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  dummyHash ??= hashPassword(crypto.randomUUID());
  return dummyHash;
}
