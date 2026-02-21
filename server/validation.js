/**
 * ============================================================================
 * Input Validation — Schema-Based with Zod (OWASP Best Practices)
 * ============================================================================
 *
 * Every public endpoint validates input against a strict schema:
 *   - Type checking (string, number, email format)
 *   - Length limits (prevents oversized payloads)
 *   - Format validation (regex for emails, alphanumeric for names)
 *   - Field whitelisting (.strict() rejects any unexpected fields)
 *   - No prototype pollution (Zod parses into plain objects)
 *
 * OWASP references:
 *   - A03:2021 Injection — sanitize + validate all inputs
 *   - A04:2021 Insecure Design — schema-first validation
 * ============================================================================
 */

import { z } from 'zod';

// ── Shared validation patterns ──────────────────────────────────────────────

// RFC 5322 simplified email regex — stricter than default Zod .email()
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Allow letters, spaces, hyphens, apostrophes (covers international names)
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// Block common injection patterns as an extra safety layer
const INJECTION_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /on\w+\s*=/i,           // onclick=, onerror=, etc.
  /data:text\/html/i,
  /vbscript:/i,
  /expression\s*\(/i,     // CSS expression()
];

/**
 * Check for injection patterns in a string value.
 * Returns true if suspicious content is detected.
 */
function containsInjection(value) {
  if (typeof value !== 'string') return false;
  return INJECTION_PATTERNS.some(pattern => pattern.test(value));
}


// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// ── Newsletter Subscription ─────────────────────────────────────────────────
// Accepts: { email: string }
// Rejects: any additional fields, invalid email, oversized input
const newsletterSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.',
    })
    .trim()
    .min(5, 'Email must be at least 5 characters.')
    .max(254, 'Email must not exceed 254 characters.')           // RFC 5321 max
    .regex(EMAIL_REGEX, 'Please enter a valid email address.')
    .refine(val => !containsInjection(val), {
      message: 'Invalid characters detected in email.',
    }),
}).strict();   // ← REJECTS any field not defined above


// ── Contact Form ────────────────────────────────────────────────────────────
// Accepts: { name, email, message }
// Rejects: unexpected fields, XSS attempts, oversized inputs
const contactSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required.',
      invalid_type_error: 'Name must be a string.',
    })
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must not exceed 100 characters.')
    .regex(NAME_REGEX, 'Name contains invalid characters.')
    .refine(val => !containsInjection(val), {
      message: 'Invalid characters detected in name.',
    }),

  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.',
    })
    .trim()
    .min(5, 'Email must be at least 5 characters.')
    .max(254, 'Email must not exceed 254 characters.')
    .regex(EMAIL_REGEX, 'Please enter a valid email address.')
    .refine(val => !containsInjection(val), {
      message: 'Invalid characters detected in email.',
    }),

  message: z
    .string({
      required_error: 'Message is required.',
      invalid_type_error: 'Message must be a string.',
    })
    .trim()
    .min(10, 'Message must be at least 10 characters.')
    .max(2000, 'Message must not exceed 2000 characters.')
    .refine(val => !containsInjection(val), {
      message: 'Invalid content detected in message.',
    }),
}).strict();


// ── User Feedback ───────────────────────────────────────────────────────────
// Accepts: { rating: 1-5, comment?: string }
const feedbackSchema = z.object({
  rating: z
    .number({
      required_error: 'Rating is required.',
      invalid_type_error: 'Rating must be a number.',
    })
    .int('Rating must be a whole number.')
    .min(1, 'Rating must be between 1 and 5.')
    .max(5, 'Rating must be between 1 and 5.'),

  comment: z
    .string()
    .trim()
    .max(1000, 'Comment must not exceed 1000 characters.')
    .refine(val => !containsInjection(val), {
      message: 'Invalid content detected in comment.',
    })
    .optional()
    .default(''),
}).strict();


// ============================================================================
// VALIDATION FUNCTIONS
// Each returns { data, error } — never throws
// ============================================================================

/**
 * Validate newsletter input.
 * @param {unknown} input — raw request body
 * @returns {{ data?: { email: string }, error?: string }}
 */
export function validateNewsletterInput(input) {
  const result = newsletterSchema.safeParse(input);
  if (!result.success) {
    // Return the first human-readable error message
    const firstError = result.error.errors[0];
    return { error: firstError?.message || 'Invalid input.' };
  }
  return { data: result.data };
}

/**
 * Validate contact form input.
 * @param {unknown} input — raw request body
 * @returns {{ data?: { name: string, email: string, message: string }, error?: string }}
 */
export function validateContactInput(input) {
  const result = contactSchema.safeParse(input);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return { error: firstError?.message || 'Invalid input.' };
  }
  return { data: result.data };
}

/**
 * Validate feedback input.
 * @param {unknown} input — raw request body
 * @returns {{ data?: { rating: number, comment: string }, error?: string }}
 */
export function validateFeedbackInput(input) {
  const result = feedbackSchema.safeParse(input);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return { error: firstError?.message || 'Invalid input.' };
  }
  return { data: result.data };
}
