/**
 * Centralized constants for the Langfuse Prompt MCP Server
 * 
 * This file contains all magic numbers, thresholds, and constant values
 * used throughout the application to improve maintainability.
 */

/**
 * Score thresholds for evaluation quality levels
 */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 0.9,    // 90%+ - Exceptional quality
  GOOD: 0.8,         // 80%+ - Strong performance
  MODERATE: 0.7,     // 70%+ - Acceptable
  WEAK: 0.6,         // 60%+ - Needs improvement
  POOR: 0.5,         // 50%+ - Significant issues
  CRITICAL: 0.4,     // Below 40% - Critical problems
} as const;

export type ScoreThreshold = typeof SCORE_THRESHOLDS[keyof typeof SCORE_THRESHOLDS];

/**
 * Improvement-related constants
 */
export const IMPROVEMENT = {
  SCORE_PER_TECHNIQUE: 10,  // Estimated score increase per technique
  MAX_SCORE: 100,           // Maximum possible score
  MIN_SCORE: 0,             // Minimum possible score
  MAX_ITERATIONS: 5,        // Maximum improvement iterations
  MIN_IMPROVEMENT_SCORE: 85, // Target score for improvements
} as const;

/**
 * Performance monitoring thresholds (in milliseconds)
 */
export const PERFORMANCE = {
  WARNING_THRESHOLD: 1000,   // Log warning if operation takes > 1s
  ERROR_THRESHOLD: 5000,     // Log error if operation takes > 5s
  CRITICAL_THRESHOLD: 10000, // Critical if operation takes > 10s
  MONITORING_ENABLED: true,  // Enable performance monitoring
  METRICS_ENABLED: false,    // Enable detailed metrics collection
} as const;

/**
 * Logging prefixes for consistent output formatting
 */
export const LOG_PREFIX = {
  SERVER: '[Server]',
  CONFIG: '[Config]',
  HANDLER: '[Handler]',
  EVALUATOR: '[Evaluator]',
  IMPROVER: '[Improver]',
  PATTERN: '[Pattern]',
  PERFORMANCE: '[Performance]',
  ERROR: '[Error]',
  WARNING: '[Warning]',
  INFO: '[Info]',
  DEBUG: '[Debug]',
  FATAL: '[Fatal]',
} as const;

export type LogPrefix = typeof LOG_PREFIX[keyof typeof LOG_PREFIX];

/**
 * Response type identifiers
 */
export const RESPONSE_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  LLM_TASK: 'llm_task_required',
  VALIDATION_ERROR: 'validation_error',
  PARTIAL: 'partial',
  CACHED: 'cached',
} as const;

export type ResponseType = typeof RESPONSE_TYPE[keyof typeof RESPONSE_TYPE];

/**
 * LLM task action types
 */
export const LLM_ACTIONS = {
  REQUIRE_CLAUDE_TASK: 'require_claude_task',
  EVALUATION_JUDGE: 'prompt-evaluation-judge',
  OPUS_OPTIMIZER: 'claude4-opus-prompt-optimizer',
  COMPARISON_JUDGE: 'prompt-comparison-judge',
  PATTERN_ANALYZER: 'prompt-pattern-analyzer',
} as const;

export type LLMAction = typeof LLM_ACTIONS[keyof typeof LLM_ACTIONS];

/**
 * Default configuration values
 */
export const DEFAULTS = {
  CACHE_TTL: 3600000,        // 1 hour in milliseconds
  REQUEST_TIMEOUT: 30000,    // 30 seconds
  MAX_RETRIES: 3,            // Maximum retry attempts
  FLUSH_INTERVAL: 1000,      // 1 second
  FLUSH_AT: 1,               // Send after 1 event
  MAX_PROMPT_LENGTH: 10000,  // Maximum prompt length in characters
  MIN_PROMPT_LENGTH: 10,     // Minimum prompt length in characters
  PATTERN_MIN_SCORE: 80,     // Minimum score for pattern extraction
  PATTERN_LIMIT: 100,        // Default number of prompts to analyze
} as const;

/**
 * Evaluation criteria weights
 */
export const CRITERIA_WEIGHTS = {
  clarity: 1.2,
  structure: 1.1,
  examples: 1.0,
  chainOfThought: 1.1,
  techSpecificity: 1.2,
  errorHandling: 1.0,
  performance: 0.9,
  testing: 0.9,
  outputFormat: 1.0,
  deployment: 0.8,
} as const;

export type CriteriaWeight = typeof CRITERIA_WEIGHTS[keyof typeof CRITERIA_WEIGHTS];

/**
 * Model-specific constants
 */
export const MODEL_CONSTANTS = {
  CLAUDE: {
    MAX_TOKENS: 200000,
    OPTIMAL_PROMPT_LENGTH: 2000,
    SUPPORTS_XML: true,
    SUPPORTS_IMAGES: true,
  },
  GPT: {
    MAX_TOKENS: 128000,
    OPTIMAL_PROMPT_LENGTH: 1500,
    SUPPORTS_XML: false,
    SUPPORTS_IMAGES: true,
  },
  GEMINI: {
    MAX_TOKENS: 1000000,
    OPTIMAL_PROMPT_LENGTH: 2500,
    SUPPORTS_XML: false,
    SUPPORTS_IMAGES: true,
  },
} as const;

export type ModelConstant = typeof MODEL_CONSTANTS[keyof typeof MODEL_CONSTANTS];

/**
 * Cache keys for various operations
 */
export const CACHE_KEYS = {
  EVALUATION_PREFIX: 'eval:',
  IMPROVEMENT_PREFIX: 'improve:',
  PATTERN_PREFIX: 'pattern:',
  PROMPT_PREFIX: 'prompt:',
  WORDCOUNT_PREFIX: 'wc:',
} as const;

export type CacheKey = typeof CACHE_KEYS[keyof typeof CACHE_KEYS];

/**
 * Error codes for standardized error handling
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LANGFUSE_ERROR: 'LANGFUSE_ERROR',
  EVALUATION_ERROR: 'EVALUATION_ERROR',
  IMPROVEMENT_ERROR: 'IMPROVEMENT_ERROR',
  PATTERN_ERROR: 'PATTERN_ERROR',
  DEPLOYMENT_ERROR: 'DEPLOYMENT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Feature flags for enabling/disabling functionality
 */
export const FEATURE_FLAGS = {
  USE_LLM_JUDGE: true,
  ENABLE_CACHING: true,
  ENABLE_PATTERNS: true,
  ENABLE_MODEL_OPTIMIZATION: true,
  ENABLE_DEPLOYMENT: true,
  ENABLE_METRICS: false,
  ENABLE_TELEMETRY: false,
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];