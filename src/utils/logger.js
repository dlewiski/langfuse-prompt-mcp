/**
 * Logger utility for consistent logging across the application
 * 
 * Provides structured logging with consistent prefixes and levels
 */

import { LOG_PREFIX, PERFORMANCE } from '../constants.js';
import { CONFIG } from '../config.js';

class Logger {
  constructor(module = 'General') {
    this.module = module;
    this.prefix = LOG_PREFIX[module.toUpperCase()] || `[${module}]`;
  }

  /**
   * Log debug message (only in debug mode)
   */
  debug(...args) {
    if (CONFIG.DEBUG_MODE) {
      console.log(this.prefix, LOG_PREFIX.DEBUG, ...args);
    }
  }

  /**
   * Log info message
   */
  info(...args) {
    console.error(this.prefix, LOG_PREFIX.INFO, ...args);
  }

  /**
   * Log warning message
   */
  warn(...args) {
    console.error(this.prefix, LOG_PREFIX.WARNING, ...args);
  }

  /**
   * Log error message
   */
  error(...args) {
    console.error(this.prefix, LOG_PREFIX.ERROR, ...args);
  }

  /**
   * Log fatal error and optionally exit
   */
  fatal(message, error = null, exitCode = 1) {
    console.error(this.prefix, LOG_PREFIX.FATAL, message);
    if (error) {
      console.error(LOG_PREFIX.FATAL, 'Stack trace:', error.stack);
    }
    if (exitCode !== null) {
      process.exit(exitCode);
    }
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration) {
    const level = this.getPerformanceLevel(duration);
    const message = `${operation} took ${duration}ms`;
    
    switch (level) {
      case 'critical':
        this.error(LOG_PREFIX.PERFORMANCE, message, '(CRITICAL)');
        break;
      case 'error':
        this.error(LOG_PREFIX.PERFORMANCE, message);
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
  getPerformanceLevel(duration) {
    if (duration > PERFORMANCE.CRITICAL_THRESHOLD) return 'critical';
    if (duration > PERFORMANCE.ERROR_THRESHOLD) return 'error';
    if (duration > PERFORMANCE.WARNING_THRESHOLD) return 'warning';
    return 'normal';
  }

  /**
   * Create a timer for performance tracking
   */
  timer(operation) {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.performance(operation, duration);
        return duration;
      }
    };
  }
}

// Export singleton instances for common modules
export const serverLogger = new Logger('Server');
export const configLogger = new Logger('Config');
export const handlerLogger = new Logger('Handler');
export const evaluatorLogger = new Logger('Evaluator');
export const improverLogger = new Logger('Improver');
export const patternLogger = new Logger('Pattern');

// Export the Logger class for custom instances
export default Logger;