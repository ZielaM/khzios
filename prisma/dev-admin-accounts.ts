/**
 * Admin panel accounts created by the development seed and used by the e2e
 * tests. The seed refuses to run in production, so these never exist there.
 * To sign in by hand, add the secret to an authenticator app as a key
 * ("enter a setup key", time-based).
 */
export const DEV_ADMIN_ACCOUNTS = {
  admin: {
    login: 'admin',
    name: 'Administrator (dev)',
    password: 'dev-password-123',
    role: 'ADMIN',
    totpSecret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
  },
  editor: {
    login: 'redaktor',
    name: 'Redaktor (dev)',
    password: 'dev-password-456',
    role: 'EDITOR',
    totpSecret: 'KRSXG5CTMVRXEZLUKRSXG5CTMVRXEZLU',
  },
  // Used by the test of a wrong 2FA code, whose failures count towards the
  // sign-in lock; the other accounts must stay unlocked
  codeCheck: {
    login: 'weryfikacja',
    name: 'Test kodu (dev)',
    password: 'dev-password-000',
    role: 'EDITOR',
    totpSecret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
  },
  // No second factor yet: the first sign-in goes through 2FA enrolment
  newcomer: {
    login: 'nowy',
    name: 'Nowe konto (dev)',
    password: 'dev-password-789',
    role: 'EDITOR',
    totpSecret: null,
  },
} as const;
