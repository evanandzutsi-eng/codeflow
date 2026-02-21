/**
 * ============================================================================
 * Client-Side Validation & Sanitization Utilities
 * ============================================================================
 *
 * Mirrors server-side validation for instant UX feedback.
 * The server ALWAYS re-validates — client validation is for UX only.
 *
 * OWASP: Never trust client-side validation alone.
 * ============================================================================
 */

// ── Validation Patterns ─────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const INJECTION_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
];

// ── Sanitization ────────────────────────────────────────────────────────────

/**
 * Sanitize a string for safe display. Escapes HTML entities.
 * @param {string} str — raw user input
 * @returns {string} — sanitized string
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Check if a string contains potential injection patterns.
 */
function hasInjection(value) {
  return INJECTION_PATTERNS.some(p => p.test(value));
}

// ── Validators ──────────────────────────────────────────────────────────────
// Each returns { valid: boolean, error?: string }

/**
 * Validate an email address.
 * Rules: required, 5–254 chars, valid format, no injection
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required.' };
  }
  const trimmed = email.trim();
  if (trimmed.length < 5) {
    return { valid: false, error: 'Email must be at least 5 characters.' };
  }
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email must not exceed 254 characters.' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (hasInjection(trimmed)) {
    return { valid: false, error: 'Invalid characters detected.' };
  }
  return { valid: true };
}

/**
 * Validate a name field.
 * Rules: required, 1–100 chars, letters/spaces/hyphens only, no injection
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required.' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Name is required.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must not exceed 100 characters.' };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters.' };
  }
  if (hasInjection(trimmed)) {
    return { valid: false, error: 'Invalid characters detected.' };
  }
  return { valid: true };
}

/**
 * Validate a message/comment field.
 * Rules: required, 10–2000 chars, no injection
 */
export function validateMessage(message, { min = 10, max = 2000, label = 'Message' } = {}) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: `${label} is required.` };
  }
  const trimmed = message.trim();
  if (trimmed.length < min) {
    return { valid: false, error: `${label} must be at least ${min} characters.` };
  }
  if (trimmed.length > max) {
    return { valid: false, error: `${label} must not exceed ${max} characters.` };
  }
  if (hasInjection(trimmed)) {
    return { valid: false, error: 'Invalid content detected.' };
  }
  return { valid: true };
}

/**
 * Validate a rating (1-5).
 */
export function validateRating(rating) {
  if (typeof rating !== 'number' || !Number.isInteger(rating)) {
    return { valid: false, error: 'Rating must be a whole number.' };
  }
  if (rating < 1 || rating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5.' };
  }
  return { valid: true };
}
