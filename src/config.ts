/**
 * Configuration module for Langfuse Prompt MCP Server
 *
 * Handles environment configuration, Langfuse client initialization,
 * and application constants.
 *
 * @module config
 */

import { Langfuse } from 'langfuse';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
// Avoid circular dependency - use console directly for config logging
const configLogger = {
  info: (msg: string) => console.log(`[CONFIG INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[CONFIG WARN] ${msg}`),
  error: (msg: string) => console.error(`[CONFIG ERROR] ${msg}`),
  debug: (msg: string) => console.log(`[CONFIG DEBUG] ${msg}`)
};
import { DEFAULTS, CRITERIA_WEIGHTS } from './constants.js';
import type { LangfuseClient } from './types/langfuse.js';
import type { EvaluationCriterion, TargetModel } from './types/domain.js';

/**
 * Evaluation criterion configuration
 */
export interface CriterionConfig {
  weight: number;
  description: string;
  minScore?: number;
}

/**
 * Model-specific configuration
 */
export interface ModelConfiguration {
  preferredStructure: 'xml' | 'json' | 'markdown';
  maxContextWindow: number;
  supportsThinking?: boolean;
  supportsPrefilling?: boolean;
  supportsSystemMessage?: boolean;
  supportsFunctionCalling?: boolean;
  supportsGrounding?: boolean;
  supportsContextCaching?: boolean;
  defaultTemperature?: number;
  defaultSafetyLevel?: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
  MIN_IMPROVEMENT_SCORE: number;
  MAX_ITERATIONS: number;
  PATTERN_MIN_SCORE: number;
  PATTERN_MIN_OCCURRENCES: number;
  USE_LLM_JUDGE: boolean;
  LLM_MODEL: string;
  CACHE_TTL: number;
  REQUEST_TIMEOUT: number;
  ENABLE_METRICS: boolean;
  DEBUG_MODE: boolean;
  ENABLE_MODEL_OPTIMIZATION: boolean;
  DEFAULT_TARGET_MODEL: string;
  MODEL_DETECTION_CONFIDENCE_THRESHOLD: number;
}

// Determine environment file path
const envPath = join(process.env.HOME || '', '.claude', '.env');

// Load environment variables with validation
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  // Logging will be done in validateConfig
} else {
  // Logging will be done in validateConfig
}

/**
 * Validate required environment variables
 */
const validateConfig = (): boolean => {
  // Log environment loading status
  if (existsSync(envPath)) {
    configLogger.info(`Loaded environment from ${envPath}`);
  } else {
    configLogger.warn(`Environment file not found at ${envPath}`);
    configLogger.warn('Using environment variables or defaults');
  }

  const required = ['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    configLogger.error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
    configLogger.error('Please set these in your .env file or environment');
    // Don't exit, allow graceful degradation
  }

  return missing.length === 0;
};

const isConfigValid = validateConfig();

/**
 * Initialize Langfuse client with error handling
 */
export const langfuse: any | null = isConfigValid
  ? new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      secretKey: process.env.LANGFUSE_SECRET_KEY!,
      baseUrl: process.env.LANGFUSE_HOST || 'http://localhost:3000',
      // Add timeout and retry configuration
      requestTimeout: parseInt(process.env.LANGFUSE_TIMEOUT || '') || DEFAULTS.REQUEST_TIMEOUT,
      maxRetries: parseInt(process.env.LANGFUSE_MAX_RETRIES || '') || DEFAULTS.MAX_RETRIES,
      // CRITICAL: Set low flush thresholds to ensure events are sent promptly
      flushAt: parseInt(process.env.LANGFUSE_FLUSH_AT || '') || DEFAULTS.FLUSH_AT,
      flushInterval: parseInt(process.env.LANGFUSE_FLUSH_INTERVAL || '') || DEFAULTS.FLUSH_INTERVAL,
      // Enable debug mode if requested
      debug: process.env.LANGFUSE_DEBUG === 'true',
    } as any) // Cast as Langfuse may have additional config options
  : null;

if (!langfuse) {
  configLogger.warn(
    'Langfuse client not initialized due to missing configuration'
  );
}

/**
 * Evaluation criteria with weights for prompt scoring
 */
export const EVALUATION_CRITERIA: Record<EvaluationCriterion, CriterionConfig> = Object.freeze({
  clarity: {
    weight: CRITERIA_WEIGHTS.clarity,
    description: 'Unambiguous instructions',
    minScore: 0.6,
  },
  structure: {
    weight: CRITERIA_WEIGHTS.structure,
    description: 'XML tags and organization',
    minScore: 0.5,
  },
  examples: {
    weight: CRITERIA_WEIGHTS.examples,
    description: '2-3 examples with reasoning',
    minScore: 0.4,
  },
  chainOfThought: {
    weight: CRITERIA_WEIGHTS.chainOfThought,
    description: 'Explicit thinking sections',
    minScore: 0.5,
  },
  techSpecificity: {
    weight: CRITERIA_WEIGHTS.techSpecificity,
    description: 'Framework-specific patterns',
    minScore: 0.6,
  },
  errorHandling: {
    weight: CRITERIA_WEIGHTS.errorHandling,
    description: 'Comprehensive scenarios',
    minScore: 0.4,
  },
  performance: {
    weight: CRITERIA_WEIGHTS.performance,
    description: 'Optimization mentions',
    minScore: 0.3,
  },
  testing: {
    weight: CRITERIA_WEIGHTS.testing,
    description: 'Test specifications',
    minScore: 0.3,
  },
  outputFormat: {
    weight: CRITERIA_WEIGHTS.outputFormat,
    description: 'Clear structure definition',
    minScore: 0.5,
  },
  deployment: {
    weight: CRITERIA_WEIGHTS.deployment,
    description: 'Production considerations',
    minScore: 0.3,
  },
});

/**
 * Parse integer with validation and default
 */
const parseIntWithValidation = (
  value: string | undefined,
  defaultValue: number,
  min: number = 0,
  max: number = Infinity
): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

/**
 * Parse float with validation and default
 */
const parseFloatWithValidation = (
  value: string | undefined,
  defaultValue: number,
  min: number = 0,
  max: number = 1
): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return defaultValue;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

/**
 * Model-specific configuration
 */
export const MODEL_CONFIG: Record<TargetModel | 'generic' | 'universal', ModelConfiguration> = Object.freeze({
  claude: {
    preferredStructure: 'xml',
    maxContextWindow: 200000,
    supportsThinking: true,
    supportsPrefilling: true,
    defaultTemperature: 0.7,
  },
  gpt: {
    preferredStructure: 'json',
    maxContextWindow: 270000,
    supportsSystemMessage: true,
    supportsFunctionCalling: true,
    defaultTemperature: 0.5,
  },
  gemini: {
    preferredStructure: 'markdown',
    maxContextWindow: 2000000,
    supportsGrounding: true,
    supportsContextCaching: true,
    defaultSafetyLevel: 'BLOCK_NONE',
  },
  generic: {
    preferredStructure: 'markdown',
    maxContextWindow: 128000,
    defaultTemperature: 0.5,
  },
  universal: {
    preferredStructure: 'markdown',
    maxContextWindow: 128000,
    defaultTemperature: 0.5,
  },
});

/**
 * Application configuration constants
 */
export const CONFIG: Readonly<AppConfig> = Object.freeze({
  // Scoring thresholds
  MIN_IMPROVEMENT_SCORE: parseIntWithValidation(
    process.env.MIN_IMPROVEMENT_SCORE,
    85,
    0,
    100
  ),

  // Iteration limits
  MAX_ITERATIONS: parseIntWithValidation(
    process.env.MAX_ITERATIONS,
    5,
    1,
    10
  ),

  // Pattern extraction
  PATTERN_MIN_SCORE: parseIntWithValidation(
    process.env.PATTERN_MIN_SCORE,
    80,
    0,
    100
  ),
  PATTERN_MIN_OCCURRENCES: parseIntWithValidation(
    process.env.PATTERN_MIN_OCCURRENCES,
    3,
    1,
    100
  ),

  // LLM configuration
  USE_LLM_JUDGE: process.env.USE_LLM_JUDGE !== 'false',
  LLM_MODEL: process.env.LLM_MODEL || 'claude-sonnet-4',

  // Performance settings
  CACHE_TTL: parseIntWithValidation(
    process.env.CACHE_TTL,
    DEFAULTS.CACHE_TTL,
    0,
    86400000 // Default 1 hour, max 24 hours
  ),
  REQUEST_TIMEOUT: parseIntWithValidation(
    process.env.REQUEST_TIMEOUT,
    DEFAULTS.REQUEST_TIMEOUT,
    1000,
    120000 // Default 30s, max 2 min
  ),

  // Feature flags
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  DEBUG_MODE: process.env.DEBUG === 'true',

  // Model optimization settings
  ENABLE_MODEL_OPTIMIZATION: process.env.ENABLE_MODEL_OPTIMIZATION !== 'false',
  DEFAULT_TARGET_MODEL: process.env.DEFAULT_TARGET_MODEL || 'auto',
  MODEL_DETECTION_CONFIDENCE_THRESHOLD: parseFloatWithValidation(
    process.env.MODEL_DETECTION_CONFIDENCE_THRESHOLD,
    0.7,
    0,
    1
  ),
});

// Log configuration in debug mode
if (CONFIG.DEBUG_MODE) {
  configLogger.debug('Running with configuration:', CONFIG);
  configLogger.debug('Model configuration:', MODEL_CONFIG);
}

/**
 * Get model configuration with fallback
 */
export function getModelConfig(model: TargetModel | string): ModelConfiguration {
  return MODEL_CONFIG[model as TargetModel] || MODEL_CONFIG.generic;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig): boolean {
  const value = CONFIG[feature];
  return typeof value === 'boolean' ? value : false;
}