/**
 * Common type definitions to replace 'any' usage
 */

// ============= Configuration Types =============

export interface BaseConfig {
  [key: string]: unknown;
}

export interface ThresholdConfig extends BaseConfig {
  min?: number;
  max?: number;
  target?: number;
  high_quality?: number;
  pattern_extraction_min?: number;
}

export interface OrchestratorConfig {
  thresholds?: ThresholdConfig;
  features?: {
    autoActivation?: boolean;
    parallelProcessing?: boolean;
    caching?: boolean;
  };
  limits?: {
    maxIterations?: number;
    maxRetries?: number;
    timeout?: number;
  };
}

// ============= Handler Types =============

export interface HandlerParams {
  prompt?: string;
  promptId?: string;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HandlerResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export type AsyncHandler<P = HandlerParams, R = unknown> = (params: P) => Promise<R>;

// ============= Error Types =============

export interface ErrorDetails {
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  stack?: string;
  [key: string]: unknown;
}

export interface ErrorContext {
  operation?: string;
  module?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

// ============= Evaluation Types =============

export interface EvaluationDetails {
  scores?: Record<string, number>;
  recommendations?: string[];
  strengths?: string[];
  weaknesses?: string[];
  metadata?: Record<string, unknown>;
}

export interface TrackingDetails {
  promptId?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

// ============= Improvement Types =============

export interface ImprovementContext {
  originalPrompt: string;
  targetScore?: number;
  maxIterations?: number;
  techniques?: string[];
  metadata?: Record<string, unknown>;
}

export interface ImprovementResult {
  improved: string;
  scoreImprovement: number;
  method: string;
  techniques?: string[];
  iterations?: number;
  metadata?: Record<string, unknown>;
}

// ============= Pattern Types =============

export interface PatternContext {
  minScore?: number;
  limit?: number;
  categories?: string[];
  metadata?: Record<string, unknown>;
}

export interface ExtractedPatternDetails {
  name: string;
  description: string;
  frequency?: number;
  examples?: string[];
  category?: string;
  impact?: 'high' | 'medium' | 'low';
  [key: string]: unknown;
}

// ============= Orchestrator Types =============

export interface PhaseResult<T = unknown> {
  phase: string;
  success: boolean;
  data?: T;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationContext {
  sessionId?: string;
  userId?: string;
  config?: OrchestratorConfig;
  metadata?: Record<string, unknown>;
}

// ============= Utility Types =============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncFunction<T = void> = () => Promise<T>;

export type Callback<T = void> = (error?: Error | null, result?: T) => void;

// ============= Score Types =============

export interface ScoreData {
  score: number;
  weighted?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ScoreComparison {
  scoreA: number;
  scoreB: number;
  difference: number;
  winner: 'A' | 'B' | 'tie';
  metadata?: Record<string, unknown>;
}

// ============= Cache Types =============

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  ttl?: number;
  metadata?: Record<string, unknown>;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  strategy?: 'lru' | 'fifo' | 'lfu';
}

// ============= Logger Types =============

export interface LogContext {
  module?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface LogMetadata {
  timestamp?: Date;
  level?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  context?: LogContext;
  [key: string]: unknown;
}