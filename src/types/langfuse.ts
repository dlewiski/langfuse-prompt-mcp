/**
 * Langfuse Integration Type Definitions
 * Types for Langfuse SDK integration and API interactions
 */

import { z } from 'zod';

// ============= Langfuse Core Types =============

/**
 * Langfuse client configuration
 */
export interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
  enabled?: boolean;
}

/**
 * Langfuse trace object
 */
export interface LangfuseTrace {
  id: string;
  name?: string;
  metadata?: Record<string, unknown>;
  release?: string;
  version?: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  input?: unknown;
  output?: unknown;
  timestamp?: Date;
}

/**
 * Langfuse generation object
 */
export interface LangfuseGeneration {
  traceId?: string;
  name: string;
  model?: string;
  modelParameters?: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  completionStartTime?: Date;
  endTime?: Date;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/**
 * Langfuse score object
 */
export interface LangfuseScore {
  traceId?: string;
  observationId?: string;
  name: string;
  value: number;
  comment?: string;
  dataType?: 'NUMERIC' | 'CATEGORICAL' | 'BOOLEAN';
  configId?: string;
}

/**
 * Langfuse prompt template
 */
export interface LangfusePromptTemplate {
  id: string;
  name: string;
  prompt: string;
  version?: number;
  config?: Record<string, unknown>;
  labels?: string[];
  tags?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Langfuse dataset
 */
export interface LangfuseDataset {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Langfuse dataset item
 */
export interface LangfuseDatasetItem {
  id: string;
  datasetId: string;
  input: unknown;
  expectedOutput?: unknown;
  metadata?: Record<string, unknown>;
  sourceTraceId?: string;
  sourceObservationId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============= Langfuse API Response Types =============

/**
 * Langfuse API error response
 */
export interface LangfuseAPIError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * Langfuse prompt list response
 */
export interface LangfusePromptListResponse {
  data: LangfusePromptTemplate[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Langfuse trace list response
 */
export interface LangfuseTraceListResponse {
  data: LangfuseTrace[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============= Langfuse Event Types =============

/**
 * Langfuse event types
 */
export type LangfuseEventType = 
  | 'trace-create'
  | 'generation-create'
  | 'generation-update'
  | 'score-create'
  | 'event-create'
  | 'span-create'
  | 'span-update';

/**
 * Langfuse event payload
 */
export interface LangfuseEvent<T = unknown> {
  id: string;
  type: LangfuseEventType;
  timestamp: Date;
  body: T;
}

// ============= Langfuse Observation Types =============

/**
 * Langfuse observation type
 */
export type LangfuseObservationType = 
  | 'GENERATION'
  | 'SPAN'
  | 'EVENT';

/**
 * Base observation interface
 */
export interface LangfuseObservation {
  id: string;
  traceId: string;
  type: LangfuseObservationType;
  name?: string;
  metadata?: Record<string, unknown>;
  parentObservationId?: string;
  startTime?: Date;
  endTime?: Date;
  input?: unknown;
  output?: unknown;
  level?: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
  statusMessage?: string;
  version?: string;
}

/**
 * Langfuse span observation
 */
export interface LangfuseSpan extends LangfuseObservation {
  type: 'SPAN';
}

/**
 * Langfuse event observation
 */
export interface LangfuseEventObservation extends LangfuseObservation {
  type: 'EVENT';
}

// ============= Validation Schemas =============

/**
 * Langfuse config validation schema
 */
export const LangfuseConfigSchema = z.object({
  publicKey: z.string().min(1),
  secretKey: z.string().min(1),
  host: z.string().url().optional(),
  flushAt: z.number().positive().optional(),
  flushInterval: z.number().positive().optional(),
  enabled: z.boolean().optional()
});

/**
 * Langfuse trace creation schema
 */
export const LangfuseTraceSchema = z.object({
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  release: z.string().optional(),
  version: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  input: z.unknown().optional(),
  output: z.unknown().optional()
});

/**
 * Langfuse score creation schema
 */
export const LangfuseScoreSchema = z.object({
  traceId: z.string().optional(),
  observationId: z.string().optional(),
  name: z.string().min(1),
  value: z.number(),
  comment: z.string().optional(),
  dataType: z.enum(['NUMERIC', 'CATEGORICAL', 'BOOLEAN']).optional(),
  configId: z.string().optional()
});

// ============= Type Guards =============

/**
 * Type guard for Langfuse API error
 */
export function isLangfuseAPIError(value: unknown): value is LangfuseAPIError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    'message' in value &&
    'statusCode' in value
  );
}

/**
 * Type guard for Langfuse generation
 */
export function isLangfuseGeneration(value: unknown): value is LangfuseGeneration {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as any).name === 'string'
  );
}

// ============= Error Classes =============

/**
 * Langfuse connection error
 */
export class LangfuseConnectionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'LangfuseConnectionError';
  }
}

/**
 * Langfuse API error class
 */
export class LangfuseAPIErrorClass extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'LangfuseAPIError';
  }
}

// ============= Helper Types =============

/**
 * Langfuse client instance type
 * Note: This is a simplified interface. The actual Langfuse client has more methods.
 */
export interface LangfuseClient {
  trace(params: Partial<LangfuseTrace>): LangfuseTraceClient;
  score(params: LangfuseScore): Promise<void>;
  generation(params: LangfuseGeneration): Promise<void>;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Langfuse trace client for chaining operations
 */
export interface LangfuseTraceClient {
  id: string;
  generation(params: Partial<LangfuseGeneration>): LangfuseGenerationClient;
  span(params: Partial<LangfuseSpan>): LangfuseSpanClient;
  event(params: Partial<LangfuseEventObservation>): void;
  score(params: Omit<LangfuseScore, 'traceId'>): Promise<void>;
  update(params: Partial<LangfuseTrace>): void;
}

/**
 * Langfuse generation client
 */
export interface LangfuseGenerationClient {
  id: string;
  update(params: Partial<LangfuseGeneration>): void;
  score(params: Omit<LangfuseScore, 'observationId'>): Promise<void>;
  end(params?: { output?: unknown; metadata?: Record<string, unknown> }): void;
}

/**
 * Langfuse span client
 */
export interface LangfuseSpanClient {
  id: string;
  generation(params: Partial<LangfuseGeneration>): LangfuseGenerationClient;
  span(params: Partial<LangfuseSpan>): LangfuseSpanClient;
  event(params: Partial<LangfuseEventObservation>): void;
  update(params: Partial<LangfuseSpan>): void;
  end(params?: { output?: unknown; metadata?: Record<string, unknown> }): void;
}