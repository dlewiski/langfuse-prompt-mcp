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