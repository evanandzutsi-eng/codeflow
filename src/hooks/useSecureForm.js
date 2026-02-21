/**
 * ============================================================================
 * useSecureForm — Custom Hook for Secure Form Handling
 * ============================================================================
 *
 * Provides:
 *   - Client-side validation before submission
 *   - Rate-limit-aware submission with cooldown display
 *   - Loading, success, and error state management
 *   - Automatic retry logic on CSRF expiration
 *   - Client-side throttling (prevents rapid re-submissions)
 * ============================================================================
 */

import { useState, useCallback, useRef } from 'react';

/**
 * @param {Function} submitFn — async function that calls the API
 * @param {Object} options
 * @param {Function} options.validate — returns null if valid, or error string
 * @param {Function} options.onSuccess — callback on successful submission
 * @param {number} options.cooldownMs — minimum ms between submissions (default: 2000)
 */
export function useSecureForm(submitFn, { validate, onSuccess, cooldownMs = 2000 } = {}) {
  const [status, setStatus] = useState('idle');    // idle | loading | success | error | rateLimited
  const [message, setMessage] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);
  const lastSubmitRef = useRef(0);

  const submit = useCallback(async (...args) => {
    // ── Client-side throttle ────────────────────────────────────────────
    const now = Date.now();
    if (now - lastSubmitRef.current < cooldownMs) {
      setStatus('error');
      setMessage('Please wait before submitting again.');
      return;
    }

    // ── Client-side validation ──────────────────────────────────────────
    if (validate) {
      const validationError = validate(...args);
      if (validationError) {
        setStatus('error');
        setMessage(validationError);
        return;
      }
    }

    // ── Submit to server ────────────────────────────────────────────────
    setStatus('loading');
    setMessage('');
    lastSubmitRef.current = now;

    try {
      const result = await submitFn(...args);

      if (result.rateLimited) {
        setStatus('rateLimited');
        setMessage(result.error);
        setRetryAfter(result.retryAfter || 60);
        return;
      }

      if (result.csrfExpired) {
        // Auto-retry once on CSRF expiration
        const retryResult = await submitFn(...args);
        if (retryResult.success) {
          setStatus('success');
          setMessage(retryResult.message || 'Success!');
          onSuccess?.(retryResult);
        } else {
          setStatus('error');
          setMessage(retryResult.error || 'Please refresh the page and try again.');
        }
        return;
      }

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Success!');
        onSuccess?.(result);
      } else {
        setStatus('error');
        setMessage(result.error || 'Something went wrong.');
      }

    } catch (err) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  }, [submitFn, validate, onSuccess, cooldownMs]);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setRetryAfter(0);
  }, []);

  return {
    status,
    message,
    retryAfter,
    submit,
    reset,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isRateLimited: status === 'rateLimited',
  };
}
