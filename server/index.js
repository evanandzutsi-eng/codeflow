/**
 * ============================================================================
 * CodeFlow Backend Server — Security-Hardened (OWASP Best Practices)
 * ============================================================================
 *
 * Security layers implemented:
 *   1. Rate limiting (IP-based + route-specific) — prevents brute-force & DDoS
 *   2. Input validation & sanitization (schema-based via Zod) — prevents XSS/injection
 *   3. Secure API key handling (env vars only, never client-exposed)
 *   4. Helmet.js security headers — prevents clickjacking, MIME sniffing, etc.
 *   5. CORS whitelist — restricts cross-origin access
 *   6. CSRF protection via double-submit cookie pattern
 *   7. Request size limits — prevents payload-based DoS
 *   8. Secure cookie configuration
 *   9. Input field whitelisting — rejects unexpected fields
 *  10. Logging for security events (rate limit hits, validation failures)
 *
 * Environment variables required — see .env.example
 * ============================================================================
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';

// ── Load environment variables FIRST (never hard-code secrets) ──────────────
dotenv.config();

import { validateNewsletterInput, validateContactInput, validateFeedbackInput } from './validation.js';
import { sanitizeString } from './sanitize.js';
import { securityLogger } from './logger.js';

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// ── Trusted proxy (set to true behind nginx/cloudflare, or specific IPs) ────
// OWASP: Ensure rate limiter sees real client IP, not proxy IP
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);


// ============================================================================
// MIDDLEWARE LAYER 1: Security Headers (Helmet.js)
// Protects against: clickjacking, MIME sniffing, XSS, and more
// ============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],   // Tailwind needs inline styles
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.ALLOWED_API_ORIGIN || 'http://localhost:3000'],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],                // Prevent iframe embedding
    },
  },
  crossOriginEmbedderPolicy: false,              // Allow cross-origin images
  hsts: {
    maxAge: 31536000,                            // 1 year HSTS
    includeSubDomains: true,
    preload: true,
  },
}));


// ============================================================================
// MIDDLEWARE LAYER 2: CORS Whitelist
// Only allow requests from known frontend origins
// ============================================================================
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      securityLogger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,                             // Allow cookies for CSRF
  methods: ['GET', 'POST'],                      // Restrict HTTP methods
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Requested-With'],
  maxAge: 600,                                   // Cache preflight for 10 min
}));


// ============================================================================
// MIDDLEWARE LAYER 3: Request Parsing with Size Limits
// Prevents payload-based denial-of-service attacks
// ============================================================================
app.use(express.json({
  limit: '16kb',                                 // OWASP: Limit body size
  strict: true,                                  // Only accept arrays/objects
}));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex')));


// ============================================================================
// MIDDLEWARE LAYER 4: Rate Limiting (IP-based + route-specific)
// Prevents brute-force attacks and API abuse
// ============================================================================

// --- Global rate limiter: applies to ALL routes ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                     // 15-minute window
  max: 100,                                      // 100 requests per window per IP
  standardHeaders: true,                         // Return rate limit info in headers
  legacyHeaders: false,                          // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    securityLogger.warn(`Global rate limit exceeded — IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(15 * 60),            // Seconds until reset
    });
  },
  keyGenerator: (req) => {
    // Use real IP behind proxy, fallback to socket address
    return req.ip || req.socket.remoteAddress;
  },
});
app.use(globalLimiter);

// --- Strict limiter for auth-sensitive endpoints (login, signup) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,                     // 15-minute window
  max: 10,                                       // Only 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn(`Auth rate limit exceeded — IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please wait 15 minutes.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

// --- Newsletter/contact form limiter (prevents spam) ---
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,                     // 1-hour window
  max: 5,                                        // 5 submissions per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn(`Form rate limit exceeded — IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'Submission limit reached. Please try again in an hour.',
      retryAfter: Math.ceil(60 * 60),
    });
  },
});

// --- API endpoint limiter ---
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,                      // 1-minute window
  max: 30,                                       // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.warn(`API rate limit exceeded — IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      success: false,
      error: 'API rate limit exceeded. Please slow down.',
      retryAfter: 60,
    });
  },
});


// ============================================================================
// MIDDLEWARE LAYER 5: CSRF Protection (Double-Submit Cookie Pattern)
// Prevents cross-site request forgery on state-changing endpoints
// ============================================================================

// Issue a CSRF token on GET /api/csrf-token
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('_csrf', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000,                             // 1 hour
    path: '/',
  });
  res.json({ csrfToken: token });
});

// Verify CSRF token on all POST/PUT/DELETE requests
const csrfProtection = (req, res, next) => {
  // Skip CSRF for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies._csrf;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    securityLogger.warn(`CSRF validation failed — IP: ${req.ip}, Path: ${req.path}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid or missing CSRF token.',
    });
  }
  next();
};


// ============================================================================
// MIDDLEWARE: Reject unexpected Content-Types
// OWASP: Only accept expected content types
// ============================================================================
const requireJSON = (req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).json({
      success: false,
      error: 'Content-Type must be application/json',
    });
  }
  next();
};


// ============================================================================
// API ROUTES — Each with dedicated rate limiter + validation
// ============================================================================

// ── Health Check (public, lightweight) ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// ── Newsletter Subscription ─────────────────────────────────────────────────
// Rate limit: 5/hour | Validates: email format, length, type
app.post('/api/newsletter',
  formLimiter,
  csrfProtection,
  requireJSON,
  async (req, res) => {
    try {
      // STEP 1: Schema-based validation (rejects unexpected fields too)
      const { data, error } = validateNewsletterInput(req.body);
      if (error) {
        securityLogger.info(`Newsletter validation failed — IP: ${req.ip}, Error: ${error}`);
        return res.status(400).json({ success: false, error });
      }

      // STEP 2: Sanitize validated data
      const email = sanitizeString(data.email).toLowerCase();

      // STEP 3: Process subscription
      // In production: save to database, call email service API, etc.
      // API keys are loaded from env vars — NEVER from client
      const emailServiceKey = process.env.EMAIL_SERVICE_API_KEY;
      if (!emailServiceKey) {
        securityLogger.error('EMAIL_SERVICE_API_KEY is not configured');
        return res.status(500).json({
          success: false,
          error: 'Service temporarily unavailable.',
        });
      }

      // TODO: Integrate with your email service (SendGrid, Mailchimp, etc.)
      // await emailService.subscribe(email, emailServiceKey);

      securityLogger.info(`Newsletter subscription — email: ${email.slice(0, 3)}***`);
      res.status(200).json({
        success: true,
        message: 'Successfully subscribed to the newsletter!',
      });

    } catch (err) {
      securityLogger.error(`Newsletter error: ${err.message}`);
      // OWASP: Never expose internal error details to client
      res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      });
    }
  }
);


// ── Contact Form ────────────────────────────────────────────────────────────
// Rate limit: 5/hour | Validates: name, email, message with length limits
app.post('/api/contact',
  formLimiter,
  csrfProtection,
  requireJSON,
  async (req, res) => {
    try {
      const { data, error } = validateContactInput(req.body);
      if (error) {
        securityLogger.info(`Contact validation failed — IP: ${req.ip}, Error: ${error}`);
        return res.status(400).json({ success: false, error });
      }

      // Sanitize all fields
      const sanitized = {
        name: sanitizeString(data.name),
        email: sanitizeString(data.email).toLowerCase(),
        message: sanitizeString(data.message),
      };

      // TODO: Send email notification, save to DB, etc.
      securityLogger.info(`Contact form submission from: ${sanitized.email.slice(0, 3)}***`);
      res.status(200).json({
        success: true,
        message: 'Message received! We\'ll get back to you soon.',
      });

    } catch (err) {
      securityLogger.error(`Contact error: ${err.message}`);
      res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      });
    }
  }
);


// ── User Feedback ───────────────────────────────────────────────────────────
// Rate limit: 5/hour | Validates: rating (1-5), comment
app.post('/api/feedback',
  formLimiter,
  csrfProtection,
  requireJSON,
  async (req, res) => {
    try {
      const { data, error } = validateFeedbackInput(req.body);
      if (error) {
        return res.status(400).json({ success: false, error });
      }

      const sanitized = {
        rating: data.rating,
        comment: sanitizeString(data.comment || ''),
      };

      // TODO: Save feedback to database
      securityLogger.info(`Feedback received — rating: ${sanitized.rating}`);
      res.status(200).json({
        success: true,
        message: 'Thank you for your feedback!',
      });

    } catch (err) {
      securityLogger.error(`Feedback error: ${err.message}`);
      res.status(500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      });
    }
  }
);


// ── AI Code Generation (protected API route) ────────────────────────────────
// Rate limit: 30/min | Requires future auth middleware
app.post('/api/generate',
  apiLimiter,
  csrfProtection,
  requireJSON,
  async (req, res) => {
    try {
      // TODO: Add authentication middleware here (JWT/session-based)
      // For now, this is a placeholder for the AI code generation feature

      const { prompt, language } = req.body;
      if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required and must be under 2000 characters.',
        });
      }

      // The AI service API key is ONLY on the server — never sent to client
      const aiApiKey = process.env.AI_SERVICE_API_KEY;
      if (!aiApiKey) {
        securityLogger.error('AI_SERVICE_API_KEY is not configured');
        return res.status(500).json({
          success: false,
          error: 'AI service temporarily unavailable.',
        });
      }

      // TODO: Call your AI service (OpenAI, Anthropic, etc.)
      // const result = await aiService.generate(sanitizeString(prompt), language, aiApiKey);

      res.status(200).json({
        success: true,
        message: 'AI generation endpoint ready. Connect your AI service.',
        data: { prompt: sanitizeString(prompt), language: language || 'javascript' },
      });

    } catch (err) {
      securityLogger.error(`AI generation error: ${err.message}`);
      res.status(500).json({
        success: false,
        error: 'An unexpected error occurred.',
      });
    }
  }
);


// ── Auth Routes (future implementation) ─────────────────────────────────────
app.post('/api/auth/login', authLimiter, csrfProtection, requireJSON, (req, res) => {
  // TODO: Implement authentication
  res.status(501).json({
    success: false,
    error: 'Authentication coming soon.',
  });
});

app.post('/api/auth/signup', authLimiter, csrfProtection, requireJSON, (req, res) => {
  // TODO: Implement registration
  res.status(501).json({
    success: false,
    error: 'Registration coming soon.',
  });
});


// ============================================================================
// ERROR HANDLING
// ============================================================================

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.',
  });
});

// ── Global Error Handler ────────────────────────────────────────────────────
// OWASP: Never leak stack traces or internal details to client
app.use((err, req, res, _next) => {
  securityLogger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body.',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error.',
  });
});


// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(`\n🔒 CodeFlow API server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`   Rate limits: Global 100/15min, Auth 10/15min, Forms 5/hr, API 30/min\n`);
});

export default app;
