/**
 * Error Types
 * Custom error types for the application
 */

export class AppError extends Error {
  public readonly type: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(message: string, type: string = 'AppError', details?: any) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'ValidationError', details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'ConfigurationError', details);
    this.name = 'ConfigurationError';
  }
}

export class EvaluationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'EvaluationError', details);
    this.name = 'EvaluationError';
  }
}

export class ImprovementError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'ImprovementError', details);
    this.name = 'ImprovementError';
  }
}

export class LangfuseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'LangfuseError', details);
    this.name = 'LangfuseError';
  }
}

/**
 * Network Error
 * Thrown when network operations fail
 */
export class NetworkError extends AppError {
  public readonly statusCode: number | undefined;
  public readonly url: string | undefined;
  
  constructor(message: string, statusCode?: number, url?: string, details?: any) {
    super(message, 'NetworkError', details);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.url = url;
  }
}

/**
 * Timeout Error
 * Thrown when operations exceed time limits
 */
export class TimeoutError extends AppError {
  public readonly timeoutMs: number | undefined;
  public readonly operation: string | undefined;
  
  constructor(message: string, timeoutMs?: number, operation?: string, details?: any) {
    super(message, 'TimeoutError', details);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    this.operation = operation;
  }
}

/**
 * Processing Error
 * Thrown when prompt processing fails
 */
export class ProcessingError extends AppError {
  public readonly phase: string | undefined;
  
  constructor(message: string, phase?: string, details?: any) {
    super(message, 'ProcessingError', details);
    this.name = 'ProcessingError';
    this.phase = phase;
  }
}