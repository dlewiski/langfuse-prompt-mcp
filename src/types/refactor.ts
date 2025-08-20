/**
 * Refactor Type Definitions
 * Comprehensive types for refactoring system, Claude hooks, pipelines, and error handling
 */

import type { MCPToolResponse, MCPErrorResponse, MCPSuccessResponse } from './mcp.js';

// ============= Claude Hook System =============

/**
 * Parameters for Claude hook operations
 */
export interface ClaudeHookParams {
  /** The action to perform */
  action: 'evaluate' | 'improve' | 'track';
  /** The prompt content to process */
  prompt: string;
  /** Optional metadata for context */
  metadata?: ClaudeHookMetadata;
  /** Configuration options */
  config?: ClaudeHookConfig;
}

/**
 * Metadata for Claude hook operations
 */
export interface ClaudeHookMetadata {
  /** Word count of the prompt */
  wordCount?: number;
  /** Complexity assessment */
  complexity?: 'simple' | 'moderate' | 'complex';
  /** Whether prompt contains code */
  hasCode?: boolean;
  /** Frameworks mentioned in prompt */
  frameworks?: string[];
  /** Category classification */
  category?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Configuration for Claude hook operations
 */
export interface ClaudeHookConfig {
  /** Target model for optimization */
  targetModel?: 'claude' | 'gpt' | 'gemini';
  /** Enable model-specific optimizations */
  enableModelOptimization?: boolean;
  /** Specific techniques to apply */
  techniques?: string[];
  /** Scoring preferences */
  scoring?: ScoringConfig;
  /** Langfuse integration settings */
  langfuse?: LangfuseConfig;
}

/**
 * Scoring configuration options
 */
export interface ScoringConfig {
  /** Minimum score threshold */
  minScore?: number;
  /** Maximum score threshold */
  maxScore?: number;
  /** Weights for different criteria */
  weights?: Record<string, number>;
  /** Include detailed breakdown */
  includeBreakdown?: boolean;
}

/**
 * Langfuse configuration options
 */
export interface LangfuseConfig {
  /** Whether to track to Langfuse */
  enabled?: boolean;
  /** Project ID */
  projectId?: string;
  /** Session ID */
  sessionId?: string;
  /** Additional tags */
  tags?: string[];
}

/**
 * Result from Claude hook operations
 */
export interface ClaudeHookResult<T = unknown> {
  /** Whether operation succeeded */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error information if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Execution timing */
  timing?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

// ============= Error Type Hierarchy =============

/**
 * Base error class for all application errors
 */
export abstract class BaseError extends Error {
  /** Error code for categorization */
  public readonly code: string;
  /** Additional context data */
  public readonly context?: Record<string, unknown>;
  /** Timestamp when error occurred */
  public readonly timestamp: Date;
  /** Severity level */
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.severity = severity;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseError);
    }
  }

  /**
   * Convert error to MCP error response
   */
  toMCPResponse(): MCPErrorResponse {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: {
        context: this.context,
        timestamp: this.timestamp.toISOString(),
        severity: this.severity
      }
    };
  }

  /**
   * Serialize error for logging
   */
  toJSON(): ErrorDetails {
    return {
      name: this.constructor.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      severity: this.severity,
      stack: this.stack
    };
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context, 'medium');
    this.name = 'ValidationError';
  }
}

/**
 * Langfuse integration error
 */
export class LangfuseError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'LANGFUSE_ERROR', context, 'high');
    this.name = 'LangfuseError';
  }
}

/**
 * Parsing error for malformed input
 */
export class ParseError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PARSE_ERROR', context, 'medium');
    this.name = 'ParseError';
  }
}

/**
 * Configuration error for invalid settings
 */
export class ConfigError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', context, 'high');
    this.name = 'ConfigError';
  }
}

/**
 * Network error for external API failures
 */
export class NetworkError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context, 'high');
    this.name = 'NetworkError';
  }
}

/**
 * Processing error for internal logic failures
 */
export class ProcessingError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PROCESSING_ERROR', context, 'high');
    this.name = 'ProcessingError';
  }
}

/**
 * Timeout error for operations that exceed time limits
 */
export class TimeoutError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', context, 'medium');
    this.name = 'TimeoutError';
  }
}

/**
 * Rate limit error for API throttling
 */
export class RateLimitError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', context, 'medium');
    this.name = 'RateLimitError';
  }
}

/**
 * Structured error details for serialization
 */
export interface ErrorDetails {
  /** Error class name */
  name: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** ISO timestamp */
  timestamp: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Stack trace */
  stack?: string;
}

// ============= Pipeline Interfaces =============

/**
 * Generic analyzer interface for processing input
 */
export interface IAnalyzer<TInput, TOutput> {
  /** Analyze input and produce output */
  analyze(input: TInput): Promise<TOutput>;
  /** Get analyzer metadata */
  getMetadata(): AnalyzerMetadata;
  /** Validate input before analysis */
  validateInput(input: TInput): ValidationResult;
}

/**
 * Generic transformer interface for modifying data
 */
export interface ITransformer<TInput, TOutput> {
  /** Transform input to output */
  transform(input: TInput): Promise<TOutput>;
  /** Get transformer metadata */
  getMetadata(): TransformerMetadata;
  /** Validate input before transformation */
  validateInput(input: TInput): ValidationResult;
}

/**
 * Generic validator interface for checking data integrity
 */
export interface IValidator<T> {
  /** Validate data */
  validate(data: T): Promise<ValidationResult>;
  /** Get validator metadata */
  getMetadata(): ValidatorMetadata;
  /** Get validation rules */
  getRules(): ValidationRule[];
}

/**
 * Metadata for analyzer components
 */
export interface AnalyzerMetadata {
  /** Analyzer name */
  name: string;
  /** Version */
  version: string;
  /** Description */
  description: string;
  /** Supported input types */
  supportedInputTypes: string[];
  /** Output type */
  outputType: string;
  /** Performance characteristics */
  performance?: PerformanceCharacteristics;
}

/**
 * Metadata for transformer components
 */
export interface TransformerMetadata {
  /** Transformer name */
  name: string;
  /** Version */
  version: string;
  /** Description */
  description: string;
  /** Supported input types */
  supportedInputTypes: string[];
  /** Output type */
  outputType: string;
  /** Transformation capabilities */
  capabilities: string[];
  /** Performance characteristics */
  performance?: PerformanceCharacteristics;
}

/**
 * Metadata for validator components
 */
export interface ValidatorMetadata {
  /** Validator name */
  name: string;
  /** Version */
  version: string;
  /** Description */
  description: string;
  /** Validation scope */
  scope: string[];
  /** Severity levels */
  severityLevels: string[];
}

/**
 * Performance characteristics for components
 */
export interface PerformanceCharacteristics {
  /** Average execution time in milliseconds */
  averageExecutionTime: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** CPU intensity level */
  cpuIntensity: 'low' | 'medium' | 'high';
  /** Throughput items per second */
  throughput: number;
}

/**
 * Validation result from validators
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors if any */
  errors: ValidationIssue[];
  /** Validation warnings */
  warnings: ValidationIssue[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  /** Issue code */
  code: string;
  /** Human readable message */
  message: string;
  /** Field path if applicable */
  path?: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule function */
  rule: (value: unknown) => boolean | Promise<boolean>;
  /** Error message template */
  errorMessage: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Pipeline result for processing operations
 */
export interface PipelineResult<T = unknown> {
  /** Whether pipeline succeeded */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error information if failed */
  error?: ErrorDetails;
  /** Pipeline execution metadata */
  metadata: PipelineMetadata;
  /** Timing information */
  timing: TimingInfo;
  /** Quality metrics */
  quality?: QualityMetrics;
}

/**
 * Pipeline execution metadata
 */
export interface PipelineMetadata {
  /** Pipeline identifier */
  pipelineId: string;
  /** Execution ID */
  executionId: string;
  /** Pipeline version */
  version: string;
  /** Steps executed */
  steps: StepMetadata[];
  /** Total steps */
  totalSteps: number;
  /** Steps completed */
  completedSteps: number;
  /** Configuration used */
  configuration: Record<string, unknown>;
}

/**
 * Individual step metadata
 */
export interface StepMetadata {
  /** Step name */
  name: string;
  /** Step status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  /** Start time */
  startTime: number;
  /** End time */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Step output summary */
  output?: unknown;
  /** Error if step failed */
  error?: ErrorDetails;
}

/**
 * Timing information for operations
 */
export interface TimingInfo {
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Total duration in milliseconds */
  duration: number;
  /** Breakdown by component */
  breakdown?: Record<string, number>;
}

/**
 * Quality metrics for results
 */
export interface QualityMetrics {
  /** Overall quality score 0-100 */
  score: number;
  /** Individual metric scores */
  metrics: Record<string, number>;
  /** Quality assessment */
  assessment: 'poor' | 'fair' | 'good' | 'excellent';
  /** Recommendations for improvement */
  recommendations: string[];
}

// ============= Handler Types =============

/**
 * Parameters for tool handlers
 */
export interface HandlerParams<T = unknown> {
  /** Handler arguments */
  args: T;
  /** Request context */
  context?: HandlerContext;
  /** Configuration options */
  config?: HandlerConfig;
}

/**
 * Result from tool handlers
 */
export interface HandlerResult<T = unknown> {
  /** Operation result */
  result: MCPToolResponse<T>;
  /** Execution metadata */
  metadata?: HandlerMetadata;
  /** Performance metrics */
  performance?: PerformanceMetrics;
}

/**
 * Context for handler execution
 */
export interface HandlerContext {
  /** Request ID */
  requestId: string;
  /** User ID */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Start time */
  startTime: number;
  /** Additional context data */
  data?: Record<string, unknown>;
}

/**
 * Configuration for handlers
 */
export interface HandlerConfig {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Retry attempts */
  retryAttempts?: number;
  /** Cache settings */
  cache?: CacheConfig;
  /** Logging settings */
  logging?: LoggingConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean;
  /** TTL in seconds */
  ttl: number;
  /** Cache key strategy */
  keyStrategy: 'args' | 'hash' | 'custom';
  /** Custom key function */
  keyFunction?: (args: unknown) => string;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Include request/response */
  includePayload: boolean;
  /** Include timing */
  includeTiming: boolean;
  /** Include stack trace on errors */
  includeStackTrace: boolean;
}

/**
 * Handler execution metadata
 */
export interface HandlerMetadata {
  /** Handler name */
  handlerName: string;
  /** Execution ID */
  executionId: string;
  /** Start time */
  startTime: number;
  /** End time */
  endTime: number;
  /** Duration */
  duration: number;
  /** Success status */
  success: boolean;
  /** Error if any */
  error?: ErrorDetails;
}

/**
 * Performance metrics for handlers
 */
export interface PerformanceMetrics {
  /** Response time in milliseconds */
  responseTime: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Cache hit ratio */
  cacheHitRatio?: number;
  /** Request rate per second */
  requestRate?: number;
}

// ============= MCP Tool Interface Enhancement =============

/**
 * Enhanced MCP Tool interface with proper typing
 */
export interface MCPToolEnhanced<TName extends string = string, TInput = unknown, TOutput = unknown> {
  /** Tool name */
  name: TName;
  /** Tool description */
  description: string;
  /** Input schema definition */
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameter>;
    required?: readonly string[];
  };
  /** Tool handler function */
  handler?: (args: TInput, context?: HandlerContext) => Promise<MCPToolResponse<TOutput>>;
  /** Tool metadata */
  metadata?: ToolMetadata;
  /** Tool configuration */
  config?: ToolConfig;
}

/**
 * MCP Tool parameter with enhanced typing
 */
export interface MCPToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  enum?: readonly string[];
  items?: MCPToolParameter;
  properties?: Record<string, MCPToolParameter>;
  minimum?: number;
  maximum?: number;
  default?: unknown;
  format?: string;
  pattern?: string;
  examples?: unknown[];
}

/**
 * Tool metadata
 */
export interface ToolMetadata {
  /** Tool version */
  version: string;
  /** Author information */
  author?: string;
  /** Tags for categorization */
  tags: string[];
  /** Deprecation notice */
  deprecated?: boolean;
  /** Documentation URL */
  documentation?: string;
}

/**
 * Tool configuration
 */
export interface ToolConfig {
  /** Default timeout */
  timeout: number;
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  /** Caching settings */
  cache?: CacheConfig;
  /** Security settings */
  security?: SecurityConfig;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window size in seconds */
  windowSize: number;
  /** Burst allowance */
  burstSize?: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Required permissions */
  permissions: string[];
  /** Input sanitization */
  sanitizeInput: boolean;
  /** Output filtering */
  filterOutput: boolean;
  /** Audit logging */
  auditLog: boolean;
}

// ============= Type Exports =============

/**
 * Union type of all error classes
 */
export type AppError = 
  | ValidationError
  | LangfuseError
  | ParseError
  | ConfigError
  | NetworkError
  | ProcessingError
  | TimeoutError
  | RateLimitError;

/**
 * Union type of all result types
 */
export type OperationResult<T = unknown> = 
  | ClaudeHookResult<T>
  | PipelineResult<T>
  | HandlerResult<T>;

/**
 * Union type of all metadata types
 */
export type ComponentMetadata = 
  | AnalyzerMetadata
  | TransformerMetadata
  | ValidatorMetadata
  | ToolMetadata;