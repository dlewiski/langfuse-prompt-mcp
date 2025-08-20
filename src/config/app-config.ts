/**
 * Application Configuration
 * Core application settings and environment variables
 */

export interface AppConfig {
  debug: boolean;
  maxPromptLength: number;
  minPromptLength: number;
  defaultModel: string;
  evaluationTimeout: number;
  improvementTimeout: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  maxConcurrentOperations: number;
  rateLimitPerMinute: number;
  enableAutoImprovement: boolean;
  autoImprovementThreshold: number;
  patternExtractionMinScore: number;
  patternExtractionLimit: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsEnabled: boolean;
  experimentalFeatures: boolean;
}

const parseIntWithValidation = (
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number => {
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  
  return parsed;
};

const parseFloatWithValidation = (
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number => {
  if (!value) return defaultValue;
  
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return defaultValue;
  
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  
  return parsed;
};

export const CONFIG: Readonly<AppConfig> = Object.freeze({
  debug: process.env.DEBUG === 'true',
  maxPromptLength: parseIntWithValidation(
    process.env.MAX_PROMPT_LENGTH,
    10000,
    100,
    100000
  ),
  minPromptLength: parseIntWithValidation(
    process.env.MIN_PROMPT_LENGTH,
    10,
    1,
    1000
  ),
  defaultModel: process.env.DEFAULT_MODEL || 'claude',
  evaluationTimeout: parseIntWithValidation(
    process.env.EVALUATION_TIMEOUT,
    30000,
    1000,
    120000
  ),
  improvementTimeout: parseIntWithValidation(
    process.env.IMPROVEMENT_TIMEOUT,
    45000,
    1000,
    180000
  ),
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTTL: parseIntWithValidation(
    process.env.CACHE_TTL,
    3600000, // 1 hour
    60000,   // 1 minute min
    86400000 // 24 hours max
  ),
  maxConcurrentOperations: parseIntWithValidation(
    process.env.MAX_CONCURRENT_OPS,
    5,
    1,
    20
  ),
  rateLimitPerMinute: parseIntWithValidation(
    process.env.RATE_LIMIT_PER_MINUTE,
    60,
    1,
    1000
  ),
  enableAutoImprovement: process.env.ENABLE_AUTO_IMPROVEMENT !== 'false',
  autoImprovementThreshold: parseFloatWithValidation(
    process.env.AUTO_IMPROVEMENT_THRESHOLD,
    70,
    0,
    100
  ),
  patternExtractionMinScore: parseFloatWithValidation(
    process.env.PATTERN_EXTRACTION_MIN_SCORE,
    85,
    0,
    100
  ),
  patternExtractionLimit: parseIntWithValidation(
    process.env.PATTERN_EXTRACTION_LIMIT,
    100,
    1,
    1000
  ),
  logLevel: (process.env.LOG_LEVEL as AppConfig['logLevel']) || 'info',
  metricsEnabled: process.env.METRICS_ENABLED === 'true',
  experimentalFeatures: process.env.EXPERIMENTAL_FEATURES === 'true',
});

export function isFeatureEnabled(feature: keyof AppConfig): boolean {
  const value = CONFIG[feature];
  return typeof value === 'boolean' ? value : false;
}