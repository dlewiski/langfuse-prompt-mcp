/**
 * Configuration Logger
 * Minimal logger for configuration modules to avoid circular dependencies
 */

export interface ConfigLogger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string, error?: any) => void;
}

/**
 * Create a prefixed logger for configuration modules
 */
export function createConfigLogger(prefix: string): ConfigLogger {
  return {
    info: (msg: string) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[${prefix}] ${msg}`);
      }
    },
    warn: (msg: string) => {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[${prefix}] ${msg}`);
      }
    },
    error: (msg: string, error?: any) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`[${prefix}] ${msg}`, error || '');
      }
    },
  };
}