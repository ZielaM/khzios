/**
 * Security threat detection module.
 *
 * Analyses user-supplied input (search queries, parameters, IDs) for
 * patterns that indicate potential attacks. When a threat is detected
 * it is logged at WARN level so ops can investigate.
 *
 * This module does NOT block requests — the app already has proper
 * defences (Prisma parameterised queries, DOMPurify sanitisation).
 * Its purpose is **observability**: knowing WHEN someone tries something.
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('security');

// ── Attack pattern definitions ───────────────────────────────────────────

/**
 * SQL injection — focused on *clearly malicious* patterns, not single
 * keywords like `SELECT` which could be legitimate academic searches.
 */
const SQL_INJECTION_PATTERNS: RegExp[] = [
  // Tautology attacks: ' OR 1=1, " OR ""="
  /['"]?\s*(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  // UNION-based extraction
  /UNION\s+(ALL\s+)?SELECT/i,
  // Statement stacking with dangerous verbs
  /;\s*(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|EXEC)\b/i,
  // Time-based blind injection
  /WAITFOR\s+DELAY/i,
  /SLEEP\s*\(\s*\d/i,
  /BENCHMARK\s*\(/i,
  // Comment-based evasion after a quote
  /['"].*--/,
  /['"].*\/\*/,
  // System table enumeration
  /INFORMATION_SCHEMA/i,
  /pg_catalog/i,
  /sys\.(tables|columns|objects)/i,
  // xp_ extended stored procedures (SQL Server)
  /xp_cmdshell/i,
  /xp_regread/i,
];

/**
 * XSS — patterns that are never legitimate user searches.
 */
const XSS_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /\bon(error|load|click|mouseover|focus|blur|submit)\s*=/i,
  /eval\s*\(/i,
  /document\s*\.\s*(cookie|location|write|domain)/i,
  /window\s*\.\s*(location|open)/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg\s+onload/i,
  /expression\s*\(/i, // CSS expression (IE)
  /url\s*\(\s*['"]?\s*javascript/i,
];

/**
 * Path traversal — attempts to escape the current directory.
 */
const PATH_TRAVERSAL_PATTERNS: RegExp[] = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e/i,
  /%252e%252e/i, // double URL encoding
  /%c0%ae/i, // UTF-8 overlong encoding of "."
];

/**
 * Null byte injection — used to truncate strings in C-based parsers.
 */
const NULL_BYTE_PATTERN = /(%00|\x00)/;

// ── Threat types ─────────────────────────────────────────────────────────

export type ThreatType =
  | 'sql_injection'
  | 'xss'
  | 'path_traversal'
  | 'null_byte'
  | 'oversized_input';

export interface ThreatDetectionResult {
  /** Whether any threat was detected. */
  detected: boolean;
  /** List of distinct threat categories found. */
  threats: ThreatType[];
}

// ── Detection ────────────────────────────────────────────────────────────

function matchesAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => {
    p.lastIndex = 0; // reset for global patterns
    return p.test(input);
  });
}

/**
 * Scans a string for known attack patterns.
 *
 * @param input - The raw user-supplied string to analyse.
 * @param maxLength - Inputs longer than this are flagged as `oversized_input`.
 */
export function detectThreats(
  input: string,
  maxLength = 512
): ThreatDetectionResult {
  const threats: ThreatType[] = [];

  if (matchesAny(input, SQL_INJECTION_PATTERNS)) threats.push('sql_injection');
  if (matchesAny(input, XSS_PATTERNS)) threats.push('xss');
  if (matchesAny(input, PATH_TRAVERSAL_PATTERNS))
    threats.push('path_traversal');
  if (NULL_BYTE_PATTERN.test(input)) threats.push('null_byte');
  if (input.length > maxLength) threats.push('oversized_input');

  return { detected: threats.length > 0, threats };
}

// ── Audit helper ─────────────────────────────────────────────────────────

/**
 * Analyses user input and logs a security warning if threats are found.
 * Call this at the boundary where user data enters the system (validation,
 * server actions, API route handlers).
 *
 * @param context   - Where the input came from, e.g. `'search_query'`, `'tag_filter'`.
 * @param input     - The raw user-supplied string.
 * @param metadata  - Extra fields to include in the log (locale, IP, etc.).
 * @returns The detection result so callers can react if needed.
 */
export function auditInput(
  context: string,
  input: string,
  metadata?: Record<string, unknown>
): ThreatDetectionResult {
  const result = detectThreats(input);

  if (result.detected) {
    log.warn(
      {
        threats: result.threats,
        context,
        inputLength: input.length,
        // Log a safe preview (first 100 chars) for forensics
        inputPreview: input.substring(0, 100),
        ...metadata,
      },
      `⚠ Potential attack detected [${result.threats.join(', ')}] in ${context}`
    );
  }

  return result;
}

/**
 * Checks whether a string looks like a valid UUID v4.
 * Useful for validating IDs before they hit the database —
 * random strings as IDs can indicate enumeration attempts.
 */
export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * Checks a cursor / news ID for validity and logs a warning
 * if it looks suspicious (e.g. not a UUID → possible enumeration).
 */
export function auditId(
  context: string,
  id: string,
  metadata?: Record<string, unknown>
): void {
  if (!isValidUuid(id)) {
    log.warn(
      { context, idPreview: id.substring(0, 50), ...metadata },
      `⚠ Invalid ID format in ${context} — possible enumeration attempt`
    );
  }
}
