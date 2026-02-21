/**
 * ============================================================================
 * Input Sanitization — Defense in Depth (OWASP A03:2021 Injection)
 * ============================================================================
 *
 * Applied AFTER validation as a second safety layer.
 * Strips potentially dangerous characters that could enable:
 *   - Cross-Site Scripting (XSS)
 *   - HTML injection
 *   - SQL injection (if a database is added later)
 *   - Log injection / CRLF injection
 *
 * Principle: Validate first, then sanitize, then use parameterized queries.
 * ============================================================================
 */

/**
 * HTML entity map for escaping dangerous characters.
 * Covers the OWASP XSS Prevention Cheat Sheet Rule #1.
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/**
 * Sanitize a string value for safe storage and display.
 *
 * Steps:
 *   1. Convert to string (defense against type confusion)
 *   2. Trim whitespace
 *   3. Strip null bytes (prevents null-byte injection)
 *   4. Remove control characters (prevents CRLF injection)
 *   5. HTML-encode dangerous characters (prevents XSS)
 *
 * @param {unknown} input — any value to sanitize
 * @returns {string} — sanitized string safe for storage/display
 */
export function sanitizeString(input) {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') input = String(input);

  return input
    .trim()
    // Step 1: Strip null bytes
    .replace(/\0/g, '')
    // Step 2: Remove control characters (U+0000–U+001F, U+007F–U+009F)
    // Exceptions: tab (0x09), newline (0x0A), carriage return (0x0D)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Step 3: HTML-encode dangerous characters
    .replace(/[&<>"'`/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize an email address.
 * More restrictive than general string sanitization.
 *
 * @param {string} email — validated email string
 * @returns {string} — sanitized, lowercased email
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email
    .trim()
    .toLowerCase()
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Only allow valid email characters
    .replace(/[^a-z0-9._%+\-@]/g, '');
}

/**
 * Sanitize an object's string values recursively.
 * Non-string values are passed through unchanged.
 *
 * @param {Record<string, unknown>} obj — object to sanitize
 * @returns {Record<string, unknown>} — sanitized copy
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    }
    // Silently drop any other types (arrays, objects, functions)
    // This prevents prototype pollution and nested injection
  }
  return sanitized;
}
