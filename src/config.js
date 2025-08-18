/**
 * Configuration module for Langfuse Prompt MCP Server
 *
 * Handles environment configuration, Langfuse client initialization,
 * and application constants.
 *
 * @module config
 */

import { Langfuse } from "langfuse";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { join } from "path";

// Determine environment file path
const envPath = join(process.env.HOME || "", ".claude", ".env");

// Load environment variables with validation
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn(`[Config] Environment file not found at ${envPath}`);
  console.warn("[Config] Using environment variables or defaults");
}

// Validate required environment variables
const validateConfig = () => {
  const required = ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[Config] Missing required environment variables: ${missing.join(", ")}`
    );
    console.error("[Config] Please set these in your .env file or environment");
    // Don't exit, allow graceful degradation
  }

  return missing.length === 0;
};

const isConfigValid = validateConfig();

/**
 * Initialize Langfuse client with error handling
 * @type {Langfuse|null}
 */
export const langfuse = isConfigValid
  ? new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || "http://localhost:3000",
      // Add timeout and retry configuration
      requestTimeout: parseInt(process.env.LANGFUSE_TIMEOUT) || 30000,
      maxRetries: parseInt(process.env.LANGFUSE_MAX_RETRIES) || 3,
    })
  : null;

if (!langfuse) {
  console.warn(
    "[Config] Langfuse client not initialized due to missing configuration"
  );
}

/**
 * Evaluation criteria with weights for prompt scoring
 * @type {Object.<string, {weight: number, description: string, minScore?: number}>}
 */
export const EVALUATION_CRITERIA = Object.freeze({
  clarity: {
    weight: 1.2,
    description: "Unambiguous instructions",
    minScore: 0.6, // Minimum acceptable score
  },
  structure: {
    weight: 1.1,
    description: "XML tags and organization",
    minScore: 0.5,
  },
  examples: {
    weight: 1.0,
    description: "2-3 examples with reasoning",
    minScore: 0.4,
  },
  chainOfThought: {
    weight: 1.1,
    description: "Explicit thinking sections",
    minScore: 0.5,
  },
  techSpecificity: {
    weight: 1.2,
    description: "Framework-specific patterns",
    minScore: 0.6,
  },
  errorHandling: {
    weight: 1.0,
    description: "Comprehensive scenarios",
    minScore: 0.4,
  },
  performance: {
    weight: 0.9,
    description: "Optimization mentions",
    minScore: 0.3,
  },
  testing: {
    weight: 0.9,
    description: "Test specifications",
    minScore: 0.3,
  },
  outputFormat: {
    weight: 1.0,
    description: "Clear structure definition",
    minScore: 0.5,
  },
  deployment: {
    weight: 0.8,
    description: "Production considerations",
    minScore: 0.3,
  },
});

/**
 * Parse integer with validation and default
 * @param {string} value - Environment variable value
 * @param {number} defaultValue - Default if parsing fails
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number}
 */
const parseIntWithValidation = (
  value,
  defaultValue,
  min = 0,
  max = Infinity
) => {
  const parsed = parseInt(value);
  if (isNaN(parsed)) return defaultValue;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

/**
 * Model-specific configuration
 * @type {Object}
 */
export const MODEL_CONFIG = Object.freeze({
  claude: {
    preferredStructure: "xml",
    maxContextWindow: 200000,
    supportsThinking: true,
    supportsPrefilling: true,
    defaultTemperature: 0.7,
  },
  gpt: {
    preferredStructure: "json",
    maxContextWindow: 270000,
    supportsSystemMessage: true,
    supportsFunctionCalling: true,
    defaultTemperature: 0.5,
  },
  gemini: {
    preferredStructure: "markdown",
    maxContextWindow: 2000000,
    supportsGrounding: true,
    supportsContextCaching: true,
    defaultSafetyLevel: "BLOCK_NONE",
  },
  generic: {
    preferredStructure: "markdown",
    maxContextWindow: 128000,
    defaultTemperature: 0.5,
  },
});

/**
 * Application configuration constants
 * @type {Object}
 */
export const CONFIG = Object.freeze({
  // Scoring thresholds
  MIN_IMPROVEMENT_SCORE: parseIntWithValidation(
    process.env.MIN_IMPROVEMENT_SCORE,
    85,
    0,
    100
  ),

  // Iteration limits
  MAX_ITERATIONS: parseIntWithValidation(process.env.MAX_ITERATIONS, 5, 1, 10),

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
  USE_LLM_JUDGE: process.env.USE_LLM_JUDGE !== "false",
  LLM_MODEL: process.env.LLM_MODEL || "claude-sonnet-4",

  // Performance settings
  CACHE_TTL: parseIntWithValidation(
    process.env.CACHE_TTL,
    3600000,
    0,
    86400000 // Default 1 hour, max 24 hours
  ),
  REQUEST_TIMEOUT: parseIntWithValidation(
    process.env.REQUEST_TIMEOUT,
    30000,
    1000,
    120000 // Default 30s, max 2 min
  ),

  // Feature flags
  ENABLE_METRICS: process.env.ENABLE_METRICS === "true",
  DEBUG_MODE: process.env.DEBUG === "true",

  // Model optimization settings
  ENABLE_MODEL_OPTIMIZATION: process.env.ENABLE_MODEL_OPTIMIZATION !== "false",
  DEFAULT_TARGET_MODEL: process.env.DEFAULT_TARGET_MODEL || "auto",
  MODEL_DETECTION_CONFIDENCE_THRESHOLD: parseFloat(
    process.env.MODEL_DETECTION_CONFIDENCE_THRESHOLD || "0.7"
  ),
});

// Log configuration in debug mode
if (CONFIG.DEBUG_MODE) {
  console.log("[Config] Running with configuration:", CONFIG);
  console.log("[Config] Model configuration:", MODEL_CONFIG);
}
