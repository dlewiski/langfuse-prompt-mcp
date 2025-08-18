/**
 * Centralized constants for the Langfuse Prompt MCP Server
 * 
 * This file contains all magic numbers, thresholds, and constant values
 * used throughout the application to improve maintainability.
 */

// Score thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 0.9,    // 90%+ - Exceptional quality
  GOOD: 0.8,         // 80%+ - Strong performance
  MODERATE: 0.7,     // 70%+ - Acceptable
  WEAK: 0.6,         // 60%+ - Needs improvement
  POOR: 0.5,         // 50%+ - Significant issues
  CRITICAL: 0.4,     // Below 40% - Critical problems
};

// Improvement constants
export const IMPROVEMENT = {
  SCORE_PER_TECHNIQUE: 10,  // Estimated score increase per technique
  MAX_SCORE: 100,           // Maximum possible score
  MIN_SCORE: 0,             // Minimum possible score
};

// Performance thresholds (in milliseconds)
export const PERFORMANCE = {
  WARNING_THRESHOLD: 1000,   // Log warning if operation takes > 1s
  ERROR_THRESHOLD: 5000,     // Log error if operation takes > 5s
  CRITICAL_THRESHOLD: 10000, // Critical if operation takes > 10s
};

// Logging prefixes for consistency
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
};

// Response types
export const RESPONSE_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  LLM_TASK: 'llm_task_required',
  VALIDATION_ERROR: 'validation_error',
};

// LLM task actions
export const LLM_ACTIONS = {
  REQUIRE_CLAUDE_TASK: 'require_claude_task',
  EVALUATION_JUDGE: 'prompt-evaluation-judge',
  OPUS_OPTIMIZER: 'claude4-opus-prompt-optimizer',
};

// Default values
export const DEFAULTS = {
  CACHE_TTL: 3600000,        // 1 hour in milliseconds
  REQUEST_TIMEOUT: 30000,    // 30 seconds
  MAX_RETRIES: 3,            // Maximum retry attempts
  FLUSH_INTERVAL: 1000,      // 1 second
  FLUSH_AT: 1,               // Send after 1 event
};