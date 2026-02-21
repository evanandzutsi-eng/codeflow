/**
 * ============================================================================
 * Security Logger — Structured Logging for Security Events
 * ============================================================================
 *
 * Logs security-relevant events (rate limits, validation failures, errors)
 * in structured format for monitoring and alerting.
 *
 * In production, replace with a proper logging service:
 *   - Winston, Pino, or Bunyan for Node.js
 *   - Datadog, Splunk, or ELK Stack for centralized logging
 *
 * OWASP A09:2021 — Security Logging and Monitoring Failures
 * ============================================================================
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Format a log entry with timestamp, level, and structured data.
 * Uses ISO 8601 timestamps for consistency across time zones.
 */
function formatLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  // In production, send to your logging service instead of console
  return JSON.stringify(entry);
}

export const securityLogger = {
  error(message, meta) {
    console.error(formatLog(LOG_LEVELS.ERROR, message, meta));
  },

  warn(message, meta) {
    console.warn(formatLog(LOG_LEVELS.WARN, message, meta));
  },

  info(message, meta) {
    console.info(formatLog(LOG_LEVELS.INFO, message, meta));
  },

  debug(message, meta) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog(LOG_LEVELS.DEBUG, message, meta));
    }
  },
};
