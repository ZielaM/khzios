import { describe, it, expect } from 'vitest';
import { detectThreats } from '../security';

describe('detectThreats', () => {
  it('does not flag ordinary phrase searches', () => {
    expect(detectThreats('"jakość mleka" -krowy').detected).toBe(false);
    expect(detectThreats("Kowalski's -- review").detected).toBe(false);
  });

  it('flags a SQL comment right after a quote', () => {
    expect(detectThreats("admin' --").threats).toContain('sql_injection');
    expect(detectThreats("x'/* comment").threats).toContain('sql_injection');
  });

  it('flags common injection and XSS payloads', () => {
    expect(detectThreats("' OR 1=1").threats).toContain('sql_injection');
    expect(detectThreats('<script>alert(1)</script>').threats).toContain('xss');
    expect(detectThreats('../../etc/passwd').threats).toContain(
      'path_traversal'
    );
  });

  it('flags oversized input', () => {
    expect(detectThreats('a'.repeat(513)).threats).toContain('oversized_input');
  });
});
