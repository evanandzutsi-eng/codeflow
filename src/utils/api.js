/**
 * ============================================================================
 * Secure API Client — Handles CSRF, Rate Limits, and Error Responses
 * ============================================================================
 *
 * Centralizes all API calls through a single secure client that:
 *   1. Fetches and attaches CSRF tokens automatically
 *   2. Handles 429 rate-limit responses with user-friendly messages
 *   3. Handles network errors gracefully
 *   4. Never exposes API keys (all keys live server-side only)
 *
 * OWASP: Client-side code should NEVER contain API keys or secrets.
 *         All sensitive operations go through the backend proxy.
 * ============================================================================
 */

// ── API Base URL from environment variable (Vite uses VITE_ prefix) ─────────
// IMPORTANT: Only VITE_* env vars are exposed to the client.
// This is safe — it's just the server URL, not a secret.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── CSRF Token Cache ────────────────────────────────────────────────────────
let csrfToken = null;

/**
 * Fetch a fresh CSRF token from the server.
 * The server sets an httpOnly cookie and returns the token in JSON.
 */
async function fetchCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/api/csrf-token`, {
      credentials: 'include',   // Include cookies for CSRF
    });
    if (!res.ok) throw new Error('Failed to fetch CSRF token');
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (err) {
    console.error('CSRF token fetch failed:', err.message);
    return null;
  }
}

/**
 * Get the current CSRF token, fetching a new one if needed.
 */
async function getCsrfToken() {
  if (!csrfToken) {
    return await fetchCsrfToken();
  }
  return csrfToken;
}

/**
 * Make a secure API request.
 *
 * @param {string} endpoint — API path (e.g., '/api/newsletter')
 * @param {Object} options
 * @param {string} options.method — HTTP method (default: 'POST')
 * @param {Object} options.body — Request payload
 * @returns {Promise<{ success: boolean, message?: string, error?: string, retryAfter?: number }>}
 */
export async function apiRequest(endpoint, { method = 'POST', body = null } = {}) {
  try {
    // Step 1: Get CSRF token for POST/PUT/DELETE requests
    const token = method !== 'GET' ? await getCsrfToken() : null;

    // Step 2: Build request headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',  // Extra CSRF layer
    };
    if (token) {
      headers['X-CSRF-Token'] = token;
    }

    // Step 3: Make the request
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      credentials: 'include',  // Include cookies
      body: body ? JSON.stringify(body) : null,
    });

    // Step 4: Parse response
    const data = await res.json();

    // Step 5: Handle rate limiting (429)
    if (res.status === 429) {
      return {
        success: false,
        error: data.error || 'Too many requests. Please try again later.',
        retryAfter: data.retryAfter || 60,
        rateLimited: true,
      };
    }

    // Step 6: Handle CSRF failure — refresh token and suggest retry
    if (res.status === 403 && data.error?.includes('CSRF')) {
      csrfToken = null;  // Clear stale token
      return {
        success: false,
        error: 'Security token expired. Please try again.',
        csrfExpired: true,
      };
    }

    // Step 7: Return server response
    return data;

  } catch (err) {
    // Network error or server unreachable
    console.error(`API request failed: ${endpoint}`, err.message);
    return {
      success: false,
      error: 'Unable to connect to the server. Please check your connection.',
    };
  }
}

// ── Convenience Methods ─────────────────────────────────────────────────────

export const api = {
  /** Subscribe to newsletter */
  subscribeNewsletter: (email) =>
    apiRequest('/api/newsletter', { body: { email } }),

  /** Submit contact form */
  submitContact: (name, email, message) =>
    apiRequest('/api/contact', { body: { name, email, message } }),

  /** Submit feedback */
  submitFeedback: (rating, comment) =>
    apiRequest('/api/feedback', { body: { rating, comment } }),

  /** Generate AI code (placeholder) */
  generateCode: (prompt, language) =>
    apiRequest('/api/generate', { body: { prompt, language } }),

  /** Health check */
  healthCheck: () =>
    apiRequest('/api/health', { method: 'GET' }),
};
