import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse and brute force attacks
 * Different rate limits for different endpoint types
 */

// Strict rate limit for authentication endpoints
// Prevents brute force password attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message: {
    error: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests from the count (only failed attempts count)
  skipSuccessfulRequests: true,
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many login attempts from this IP. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 minutes',
    });
  },
});

// General API rate limit
// Prevents API abuse and DoS attacks
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    error: 'Too many requests from this IP. Please slow down.',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler
  handler: (req, res) => {
    console.warn(`⚠️  API rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests from this IP. Please slow down.',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 minute',
    });
  },
});

// Strict rate limit for data export endpoints
// Prevents resource exhaustion from large data exports
export const exportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour per IP
  message: {
    error: 'Export rate limit exceeded. Please try again in 1 hour.',
    code: 'EXPORT_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler
  handler: (req, res) => {
    console.warn(`⚠️  Export rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Export rate limit exceeded. Please try again in 1 hour.',
      code: 'EXPORT_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    });
  },
});

// Very strict rate limit for password reset endpoints
// Prevents enumeration attacks and abuse
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour per IP
  message: {
    error: 'Too many password reset requests. Please try again in 1 hour.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Custom handler
  handler: (req, res) => {
    console.warn(`⚠️  Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many password reset requests. Please try again in 1 hour.',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    });
  },
});

// Moderate rate limit for user registration
// Prevents spam account creation
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    error: 'Too many registration attempts. Please try again in 1 hour.',
    code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom handler
  handler: (req, res) => {
    console.warn(`⚠️  Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many registration attempts. Please try again in 1 hour.',
      code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      retryAfter: '1 hour',
    });
  },
});

/**
 * Rate Limiting Configuration Summary:
 *
 * 1. Authentication (login): 5 failed attempts per 15 minutes
 * 2. Password Reset: 3 attempts per hour
 * 3. Registration: 5 attempts per hour
 * 4. General API: 100 requests per minute
 * 5. Data Export: 10 exports per hour
 *
 * All rate limits are per IP address
 * All include standard RateLimit headers
 * All include custom error messages
 * All log exceeded limits for monitoring
 */
