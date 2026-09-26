export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

/** Length-only rules (NIST SP 800-63B): no forced symbols or digits. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Hasło może mieć najwyżej ${PASSWORD_MAX_LENGTH} znaków.`;
  }
  return null;
}
