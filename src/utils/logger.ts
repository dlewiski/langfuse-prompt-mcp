/**
 * Logger utility for consistent logging across the application
 * 
 * Provides structured logging with consistent prefixes and levels
 */

import { LOG_PREFIX, PERFORMANCE } from '../constants.js';
import { CONFIG } from '../config.js';

/**
 * Log levels for categorizing messages
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Performance levels based on duration thresholds
 */
export type PerformanceLevel = 'normal' | 'warning' | 'error' | 'critical';

/**
 * Timer interface for performance tracking
 */
export interface PerformanceTimer {
  end: () => number;
  cancel: () => void;
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  module?: string;
  enableDebug?: boolean;
  enablePerformance?: boolean;
  customPrefix?: string;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

/**
 * Logger class for module-specific logging
 */
export class Logger {
  private readonly module: string;
  private readonly prefix: string;
  private readonly enableDebug: boolean;
  private readonly enablePerformance: boolean;
  private readonly logHistory: LogEntry[] = [];
  private readonly maxHistorySize = 1000;

  constructor(module: string = 'General', options: LoggerOptions = {}) {
    this.module = module;
    this.prefix = options.customPrefix || 
                  LOG_PREFIX[module.toUpperCase() as keyof typeof LOG_PREFIX] || 
                  `[${module}]`;
    this.enableDebug = options.enableDebug ?? CONFIG.DEBUG_MODE;
    this.enablePerformance = options.enablePerformance ?? PERFORMANCE.MONITORING_ENABLED;
  }

  /**
   * Log debug message (only in debug mode)
   */
  debug(...args: unknown[]): void {
    if (this.enableDebug) {
      console.log(this.prefix, LOG_PREFIX.DEBUG, ...args);
      this.addToHistory(LogLevel.DEBUG, args.join(' '));
    }
  }

  /**
   * Log info message
   */
  info(...args: unknown[]): void {
    console.error(this.prefix, LOG_PREFIX.INFO, ...args);
    this.addToHistory(LogLevel.INFO, args.join(' '));
  }

  /**
   * Log warning message
   */
  warn(...args: unknown[]): void {
    console.error(this.prefix, LOG_PREFIX.WARNING, ...args);
    this.addToHistory(LogLevel.WARN, args.join(' '));
  }

  /**
   * Log error message with optional error object
   */
  error(message: string, error?: Error | unknown): void {
    console.error(this.prefix, LOG_PREFIX.ERROR, message);
    
    if (error instanceof Error) {
      console.error(LOG_PREFIX.ERROR, 'Error details:', error.message);
      if (error.stack && this.enableDebug) {
        console.error(LOG_PREFIX.ERROR, 'Stack trace:', error.stack);
      }
    } else if (error) {
      console.error(LOG_PREFIX.ERROR, 'Error details:', error);
    }
    
    this.addToHistory(LogLevel.ERROR, message, error);
  }

  /**
   * Log fatal error and optionally exit
   */
  fatal(message: string, error?: Error | unknown, exitCode: number | null = 1): void {
    console.error(this.prefix, LOG_PREFIX.FATAL, message);
    
    if (error instanceof Error) {
      console.error(LOG_PREFIX.FATAL, 'Stack trace:', error.stack);
    } else if (error) {
      console.error(LOG_PREFIX.FATAL, 'Error details:', error);
    }
    
    this.addToHistory(LogLevel.FATAL, message, error);
    
    if (exitCode !== null) {
      process.exit(exitCode);
    }
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number): void {
    if (!this.enablePerformance) return;
    
    const level = this.getPerformanceLevel(duration);
    const message = `${operation} took ${duration}ms`;
    
    switch (level) {
      case 'critical':
        this.error(`${LOG_PREFIX.PERFORMANCE} ${message} (CRITICAL)`);
        break;
      case 'error':
        this.error(`${LOG_PREFIX.PERFORMANCE} ${message}`);
        break;
      case 'warning':
        this.warn(LOG_PREFIX.PERFORMANCE, message);
        break;
      default:
        this.debug(LOG_PREFIX.PERFORMANCE, message);
    }
  }

  /**
   * Determine performance level based on duration
   */
  private getPerformanceLevel(duration: number): PerformanceLevel {
    if (duration > PERFORMANCE.CRITICAL_THRESHOLD) return 'critical';
    if (duration > PERFORMANCE.ERROR_THRESHOLD) return 'error';
    if (duration > PERFORMANCE.WARNING_THRESHOLD) return 'warning';
    return 'normal';
  }

  /**
   * Create a timer for performance tracking
   */
  timer(operation: string): PerformanceTimer {
    const start = Date.now();
    let cancelled = false;
    
    return {
      end: (): number => {
        if (cancelled) return 0;
        const duration = Date.now() - start;
        this.performance(operation, duration);
        return duration;
      },
      cancel: (): void => {
        cancelled = true;
      }
    };
  }

  /**
   * Add entry to log history
   */
  private addToHistory(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      module: this.module,
      message,
      data
    };
    
    this.logHistory.push(entry);
    
    // Trim history if it exceeds max size
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Get log history
   */
  getHistory(level?: LogLevel): ReadonlyArray<LogEntry> {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory.length = 0;
  }

  /**
   * Create a child logger with a sub-module name
   */
  child(subModule: string): Logger {
    return new Logger(`${this.module}:${subModule}`, {
      enableDebug: this.enableDebug,
      enablePerformance: this.enablePerformance
    });
  }
}

// Export singleton instances for common modules
export const serverLogger = new Logger('Server');
export const configLogger = new Logger('Config');
export const handlerLogger = new Logger('Handler');
export const evaluatorLogger = new Logger('Evaluator');
export const improverLogger = new Logger('Improver');
export const patternLogger = new Logger('Pattern');

// Export the Logger class as default
export default Logger;