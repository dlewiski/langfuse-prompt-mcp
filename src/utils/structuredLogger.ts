/**
 * Structured Logging Implementation
 * Replaces console.* with Winston for production-grade logging
 */

import winston from 'winston';
import path from 'path';

// Define log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

// Define log colors
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'gray',
};

// Create custom format for development
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Create custom format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configure transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  }),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: prodFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: prodFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  levels: LOG_LEVELS,
  transports,
  exitOnError: false,
});

// Add colors to winston
winston.addColors(LOG_COLORS);

// Create child loggers for different modules
export function createModuleLogger(moduleName: string): winston.Logger {
  return logger.child({ module: moduleName });
}

// Performance timing helper
export class LogTimer {
  private startTime: number;
  private logger: winston.Logger;
  private operation: string;

  constructor(logger: winston.Logger, operation: string) {
    this.startTime = Date.now();
    this.logger = logger;
    this.operation = operation;
    this.logger.debug(`${operation} started`);
  }

  end(metadata?: Record<string, any>): void {
    const duration = Date.now() - this.startTime;
    this.logger.info(`${this.operation} completed`, {
      duration_ms: duration,
      ...metadata,
    });
  }

  fail(error: Error, metadata?: Record<string, any>): void {
    const duration = Date.now() - this.startTime;
    this.logger.error(`${this.operation} failed`, {
      duration_ms: duration,
      error: error.message,
      stack: error.stack,
      ...metadata,
    });
  }
}

// Helper to create timers
export function createTimer(logger: winston.Logger, operation: string): LogTimer {
  return new LogTimer(logger, operation);
}

// Structured error logging
export function logError(
  logger: winston.Logger,
  error: Error | unknown,
  context: string,
  metadata?: Record<string, any>
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  logger.error(`Error in ${context}`, {
    error: errorObj.message,
    stack: errorObj.stack,
    context,
    ...metadata,
  });
}

// Structured request logging
export function logRequest(
  logger: winston.Logger,
  method: string,
  params: any,
  metadata?: Record<string, any>
): void {
  logger.info(`Request: ${method}`, {
    method,
    params,
    ...metadata,
  });
}

// Structured response logging
export function logResponse(
  logger: winston.Logger,
  method: string,
  _result: any,
  duration: number,
  metadata?: Record<string, any>
): void {
  logger.info(`Response: ${method}`, {
    method,
    duration_ms: duration,
    success: true,
    ...metadata,
  });
}

// Export convenience methods matching console interface
export const log = {
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  verbose: (message: string, ...args: any[]) => logger.verbose(message, ...args),
};

// Default export
export default logger;