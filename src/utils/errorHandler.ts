/**
 * Centralized error handling utilities
 * 
 * Provides consistent error handling patterns across the application
 */

import { errorResponse } from './response.js';
import { handlerLogger, serverLogger } from './logger.js';
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

// AppError is now imported from ../types/errors.js

/**
 * Wrap async handler functions with error handling
 * @param {Function} handler - Async handler function
 * @param {string} handlerName - Name of the handler for logging
 * @returns {Function} Wrapped handler with error handling
 */
export function withErrorHandling(handler: any, handlerName: string) {
  return async function wrappedHandler(args: any) {
    const logger = handlerLogger || serverLogger;
    const timer = logger.timer(`Handler: ${handlerName}`);
    
    try {
      const result = await handler(args);
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      return handleError(error, handlerName, args);
    }
  };
}

/**
 * Handle different types of errors consistently
 * @param {Error} error - The error to handle
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional information for debugging
 * @returns {Object} Error response
 */
export function handleError(error: any, context: string, additionalInfo: any = {}) {
  const logger = handlerLogger || serverLogger;
  
  // Zod validation errors
  if (error instanceof z.ZodError) {
    const details = error.errors.map(e => 
      `${e.path.join('.')}: ${e.message}`
    ).join('; ');
    
    logger.error(`Validation Error in ${context}: ${details}`);
    
    return errorResponse('Validation failed', {
      type: ErrorType.VALIDATION,
      details,
      context,
    });
  }
  
  // Application-specific errors
  if (error instanceof AppError) {
    logger.error(`${error.type} in ${context}: ${error.message}`, error.details);
    
    return errorResponse(error.message, {
      type: error.type,
      details: error.details,
      context,
      timestamp: error.timestamp,
    });
  }
  
  // Network/timeout errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    logger.error(`Network Error in ${context}: ${error.message}`);
    
    return errorResponse('Network error occurred', {
      type: error.code === 'ETIMEDOUT' ? ErrorType.TIMEOUT : ErrorType.NETWORK,
      message: error.message,
      context,
    });
  }
  
  // Unknown errors
  logger.error(`Unexpected Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    additionalInfo,
  });
  
  return errorResponse('An unexpected error occurred', {
    type: ErrorType.UNKNOWN,
    message: error.message,
    context,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

/**
 * Create a context-specific error handler
 * @param {string} context - The context for error handling
 * @returns {Function} Error handler function
 */
export function createErrorHandler(context: string) {
  return (error: any, additionalInfo: any) => handleError(error, context, additionalInfo);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} Result of the function
 */
export async function retryWithBackoff(fn: any, maxRetries: number = 3, initialDelay: number = 1000): Promise<any> {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Validate required fields in an object
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredFields - Required field names
 * @throws {AppError} If validation fails
 */
export function validateRequired(obj: any, requiredFields: string[]): void {
  const missing = requiredFields.filter((field: string) => !obj[field]);
  
  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      ErrorType.VALIDATION,
      { missing }
    );
  }
}