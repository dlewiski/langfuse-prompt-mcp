/**
 * Consolidated validation utilities for input sanitization and security
 * @module utils/validation-consolidated
 */

import { z } from 'zod';
import { AppError } from '../types/errors.js';

/**
 * Error types enumeration
 */
export const ErrorType = {
  VALIDATION: 'validation_error',
  EVALUATION: 'evaluation_error',
  IMPROVEMENT: 'improvement_error',
  LLM: 'llm_error',
  LANGFUSE: 'langfuse_error',
  NETWORK: 'network_error',
  TIMEOUT: 'timeout_error',
  UNKNOWN: 'unknown_error',
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errors?: string[];
  sanitized?: string;
  metadata?: {
    originalLength?: number;
    sanitizedLength?: number;
    hasCode?: boolean;
    language?: string | null;
  }
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: any, maxLength: number = 10000): string {
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
 * Validate required fields in an object
 * Unified version that throws AppError or returns ValidationResult
 */
export function validateRequired(
  obj: any, 
  requiredFields: string[],
  throwOnError: boolean = false
): ValidationResult | void {
  const missing = requiredFields.filter((field: string) => !obj[field]);
  
  if (missing.length > 0) {
    const errorMessage = `Missing required fields: ${missing.join(', ')}`;
    
    if (throwOnError) {
      throw new AppError(
        errorMessage,
        ErrorType.VALIDATION,
        { missing }
      );
    }
    
    return {
      valid: false,
      error: errorMessage,
      errors: missing.map(field => `Missing field: ${field}`)
    };
  }
  
  if (!throwOnError) {
    return { valid: true };
  }
}

/**
 * Validate and sanitize prompt text
 */
export function validatePrompt(prompt: any): ValidationResult {
  const errors: string[] = [];
  
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
 * Validate Zod schema and return consistent result
 */
export function validateSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): ValidationResult & { data?: T } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      );
      return {
        valid: false,
        errors,
        error: errors.join('; ')
      };
    }
    return {
      valid: false,
      error: 'Validation failed',
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): { 
  valid: boolean; 
  missing: string[];
  warnings: string[];
  configured: string[];
} {
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

/**
 * Detect programming language from text
 */
function detectLanguage(text: string): string | null {
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
 */
export function createRateLimiter(maxRequests: number = 10, windowMs: number = 60000) {
  const requests = new Map<string, number[]>();

  return function checkRateLimit(identifier: string) {
    const now = Date.now();
    const userRequests = requests.get(identifier) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter((time: number) => now - time < windowMs);
    
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
        if (times.every((time: number) => now - time >= windowMs)) {
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