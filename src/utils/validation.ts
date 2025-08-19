/**
 * Validation utilities for input sanitization and security
 * @module utils/validation
 */

import { z } from 'zod';

/**
 * Sanitize string input to prevent injection attacks
 * @param {string} input - Input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, maxLength = 10000) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove control characters and limit length
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, maxLength)
    .trim();
}

/**
 * Validate and sanitize prompt text
 * @param {string} prompt - Prompt text
 * @returns {Object} Validation result
 */
export function validatePrompt(prompt) {
  const errors = [];
  
  // Check basic validity
  if (!prompt || typeof prompt !== 'string') {
    errors.push('Prompt must be a non-empty string');
    return { valid: false, errors, sanitized: '' };
  }

  // Check length
  if (prompt.length < 1) {
    errors.push('Prompt is too short');
  }
  if (prompt.length > 10000) {
    errors.push('Prompt exceeds maximum length (10000 characters)');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\${.*?}/g,  // Template injection
    /<script.*?>/gi,  // Script tags
    /javascript:/gi,  // JavaScript protocol
    /on\w+\s*=/gi,  // Event handlers
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(prompt)) {
      errors.push(`Suspicious pattern detected: ${pattern.source}`);
    }
  }

  const sanitized = sanitizeString(prompt, 10000);

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
    metadata: {
      originalLength: prompt.length,
      sanitizedLength: sanitized.length,
      hasCode: /```|<code>|function|class|const|let|var/i.test(prompt),
      language: detectLanguage(prompt),
    }
  };
}

/**
 * Detect programming language from prompt
 * @param {string} text - Text to analyze
 * @returns {string|null} Detected language or null
 */
function detectLanguage(text) {
  const languagePatterns = [
    { lang: 'javascript', pattern: /\b(const|let|var|function|=>|async|await)\b/ },
    { lang: 'typescript', pattern: /\b(interface|type|enum|namespace|implements)\b/ },
    { lang: 'python', pattern: /\b(def|import|from|class|if __name__|print)\b/ },
    { lang: 'java', pattern: /\b(public|private|class|interface|extends|implements)\b/ },
    { lang: 'go', pattern: /\b(func|package|import|type|struct|interface)\b/ },
    { lang: 'rust', pattern: /\b(fn|let|mut|impl|trait|struct|enum)\b/ },
    { lang: 'sql', pattern: /\b(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE)\b/i },
  ];

  for (const { lang, pattern } of languagePatterns) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  return null;
}

/**
 * Create a rate limiter
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Rate limit checker
 */
export function createRateLimiter(maxRequests = 10, windowMs = 60000) {
  const requests = new Map();

  return function checkRateLimit(identifier) {
    const now = Date.now();
    const userRequests = requests.get(identifier) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(validRequests[0] + windowMs),
      };
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    // Clean up old identifiers periodically
    if (requests.size > 1000) {
      for (const [key, times] of requests.entries()) {
        if (times.every(time => now - time >= windowMs)) {
          requests.delete(key);
        }
      }
    }
    
    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetAt: new Date(now + windowMs),
    };
  };
}

/**
 * Validate environment configuration
 * @returns {Object} Validation result with missing variables
 */
export function validateEnvironment() {
  const required = [
    'LANGFUSE_PUBLIC_KEY',
    'LANGFUSE_SECRET_KEY',
  ];

  const optional = [
    'LANGFUSE_HOST',
    'MIN_IMPROVEMENT_SCORE',
    'MAX_ITERATIONS',
    'PATTERN_MIN_SCORE',
    'USE_LLM_JUDGE',
    'LLM_MODEL',
  ];

  const missing = required.filter(key => !process.env[key]);
  const warnings = optional.filter(key => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    configured: required.filter(key => process.env[key]),
  };
}