/**
 * Domain Type Definitions
 * Business logic types for prompt management, evaluation, and improvement
 */

import { z } from 'zod';

// ============= Prompt Types =============

/**
 * Prompt metadata for tracking
 */
export interface PromptMetadata {
  complexity?: string;
  wordCount?: number;
  hasCode?: boolean;
  frameworks?: string[];
  category?: string;
  [key: string]: unknown;
}

/**
 * Tracked prompt with metadata
 */
export interface TrackedPrompt {
  id: string;
  prompt: string;
  metadata?: PromptMetadata;
  quickScore?: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// ============= Evaluation Types =============

/**
 * Evaluation criteria names
 */
export type EvaluationCriterion = 
  | 'clarity'
  | 'structure'
  | 'examples'
  | 'chainOfThought'
  | 'techSpecificity'
  | 'errorHandling'
  | 'performance'
  | 'testing'
  | 'outputFormat'
  | 'deployment';

/**
 * Evaluation criterion score
 */
export interface CriterionScore {
  score: number;
  weight: number;
  feedback: string;
  suggestions: string[];
}

/**
 * Complete evaluation result
 */
export interface EvaluationResult {
  scores: Record<EvaluationCriterion, CriterionScore>;
  totalScore: number;
  weightedScore: number;
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  prioritizedImprovements: ImprovementPriority[];
  evaluationType: 'rule-based' | 'llm-based';
  promptId?: string;
}

/**
 * Improvement priority
 */
export interface ImprovementPriority {
  criterion: EvaluationCriterion;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  suggestion: string;
}

// ============= Improvement Types =============

/**
 * Improvement technique names
 */
export type ImprovementTechnique = 
  | 'chainOfThought'
  | 'xmlStructure'
  | 'examples'
  | 'errorHandling'
  | 'successCriteria'
  | 'performance'
  | 'outputFormat'
  | 'techSpecificity';

/**
 * Model optimization target
 */
export type TargetModel = 
  | 'claude'
  | 'gpt'
  | 'gemini'
  | 'universal';

/**
 * Improvement result
 */
export interface ImprovementResult {
  improvedPrompt: string;
  techniques: ImprovementTechnique[];
  improvements: ImprovementDetail[];
  originalScore: number;
  improvedScore: number;
  scoreGain: number;
  targetModel?: TargetModel;
  iterations?: number;
}

/**
 * Detailed improvement information
 */
export interface ImprovementDetail {
  technique: ImprovementTechnique;
  description: string;
  before?: string;
  after?: string;
  impact: 'high' | 'medium' | 'low';
}

// ============= Comparison Types =============

/**
 * Prompt comparison result
 */
export interface ComparisonResult {
  prompt1: {
    text: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  prompt2: {
    text: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  winner: 'prompt1' | 'prompt2' | 'tie';
  scoreDifference: number;
  keyDifferences: string[];
  recommendation: string;
}

// ============= Pattern Types =============

/**
 * Extracted pattern from high-scoring prompts
 */
export interface ExtractedPattern {
  name: string;
  description: string;
  frequency: number;
  examples: string[];
  category: PatternCategory;
  applicability: string[];
  impact: 'high' | 'medium' | 'low';
}

/**
 * Pattern categories
 */
export type PatternCategory = 
  | 'structure'
  | 'instruction'
  | 'example'
  | 'reasoning'
  | 'output'
  | 'error-handling'
  | 'performance';

/**
 * Pattern analysis result
 */
export interface PatternAnalysisResult {
  patterns: ExtractedPattern[];
  totalPromptsAnalyzed: number;
  averageScore: number;
  topPatterns: ExtractedPattern[];
  recommendations: string[];
}

// ============= Langfuse-Related Types =============

/**
 * Langfuse prompt version
 */
export interface LangfusePromptVersion {
  id: string;
  version: string;
  prompt: string;
  score?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  deployedAt?: Date;
}

/**
 * Langfuse deployment configuration
 */
export interface LangfuseDeployment {
  promptId: string;
  version: string;
  label: string;
  environment?: 'development' | 'staging' | 'production';
  metadata?: Record<string, unknown>;
}

// ============= Configuration Types =============

/**
 * Evaluation configuration
 */
export interface EvaluationConfig {
  weights: Record<EvaluationCriterion, number>;
  minScore: number;
  maxScore: number;
  useLLMJudge: boolean;
  llmModel?: string;
}

/**
 * Improvement configuration
 */
export interface ImprovementConfig {
  targetScore: number;
  maxIterations: number;
  enableModelOptimization: boolean;
  techniques: ImprovementTechnique[];
  targetModel?: TargetModel;
}

// ============= Validation Schemas =============

/**
 * Track tool input schema
 */
export const TrackInputSchema = z.object({
  prompt: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  quickScore: z.number().min(0).max(100).optional(),
  category: z.string().optional()
});

export type TrackInput = z.infer<typeof TrackInputSchema>;

/**
 * Evaluate tool input schema
 */
export const EvaluateInputSchema = z.object({
  prompt: z.string().min(1),
  promptId: z.string().optional()
});

export type EvaluateInput = z.infer<typeof EvaluateInputSchema>;

/**
 * Improve tool input schema
 */
export const ImproveInputSchema = z.object({
  prompt: z.string().min(1),
  promptId: z.string().optional(),
  targetModel: z.enum(['claude', 'gpt', 'gemini']).optional(),
  enableModelOptimization: z.boolean().optional(),
  techniques: z.array(z.string()).optional()
});

export type ImproveInput = z.infer<typeof ImproveInputSchema>;

/**
 * Compare tool input schema
 */
export const CompareInputSchema = z.object({
  prompt1: z.string().min(1),
  prompt2: z.string().min(1),
  promptId: z.string().optional()
});

export type CompareInput = z.infer<typeof CompareInputSchema>;

/**
 * Patterns tool input schema
 */
export const PatternsInputSchema = z.object({
  minScore: z.number().min(0).max(100).optional(),
  limit: z.number().positive().optional()
});

export type PatternsInput = z.infer<typeof PatternsInputSchema>;

/**
 * Deploy tool input schema
 */
export const DeployInputSchema = z.object({
  promptId: z.string().min(1),
  version: z.string().min(1),
  label: z.string().optional()
});

export type DeployInput = z.infer<typeof DeployInputSchema>;

// ============= Utility Types =============

/**
 * Make all properties of T deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract keys of T that have values of type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Make specific properties of T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties of T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;