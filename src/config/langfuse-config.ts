/**
 * Langfuse Configuration
 * Handles Langfuse client initialization and environment setup
 */

import { Langfuse } from 'langfuse';
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { createConfigLogger } from '../utils/config-logger.js';

// Use proper logger abstraction to avoid circular dependency
const configLogger = createConfigLogger('Config');

// Load environment variables from .claude/.env
const envPath = join(process.env.HOME || '', '.claude', '.env');
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath });
  configLogger.info(`Loaded environment from: ${envPath}`);
} else {
  configLogger.warn(`No .env file found at: ${envPath}`);
}

// Also load from local .env if it exists
dotenvConfig();

const validateConfig = (): boolean => {
  const required = ['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    configLogger.warn(`Missing required environment variables: ${missing.join(', ')}`);
    configLogger.info('Langfuse integration will be disabled');
    return false;
  }
  
  // Keys are present, let Langfuse handle validation
  return true;
};

const isConfigValid = validateConfig();

/**
 * Initialize Langfuse client if configuration is valid
 */
export const langfuse: any | null = isConfigValid
  ? new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
      flushAt: parseInt(process.env.LANGFUSE_FLUSH_AT || '10'),
      flushInterval: parseInt(process.env.LANGFUSE_FLUSH_INTERVAL || '10000'),
      requestTimeout: parseInt(process.env.LANGFUSE_REQUEST_TIMEOUT || '10000'),
      enabled: process.env.LANGFUSE_ENABLED !== 'false',
    })
  : null;

if (langfuse) {
  configLogger.info('Langfuse client initialized successfully');
  
  // Set up graceful shutdown
  process.on('beforeExit', async () => {
    if (langfuse) {
      await langfuse.flush();
      configLogger.info('Langfuse data flushed before exit');
    }
  });
} else {
  configLogger.warn('Langfuse client not initialized - running in offline mode');
}

export const isLangfuseEnabled = (): boolean => langfuse !== null;