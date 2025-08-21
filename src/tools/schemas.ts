/**
 * Validation Schemas
 * Zod schemas for runtime validation of tool inputs
 */

import { z } from 'zod';

/**
 * Track tool input validation schema
 */
export const TrackSchema = z.object({
  prompt: z.string().min(1).describe('The prompt to track'),
  category: z.string().optional().describe('Optional category'),
  metadata: z.object({
    wordCount: z.number().optional(),
    complexity: z.string().optional(),
    hasCode: z.boolean().optional(),
    frameworks: z.array(z.string()).optional(),
  }).optional().describe('Optional metadata'),
  quickScore: z.number().min(0).max(100).optional().describe('Optional quick score 0-100'),
});

export type TrackInput = z.infer<typeof TrackSchema>;

/**
 * Evaluate tool input validation schema
 */
export const EvaluateSchema = z.object({
  prompt: z.string().min(1).describe('The prompt to evaluate'),
  promptId: z.string().optional().describe('Optional Langfuse prompt ID'),
});

export type EvaluateInput = z.infer<typeof EvaluateSchema>;

/**
 * Improve tool input validation schema
 */
export const ImproveSchema = z.object({
  prompt: z.string().min(1).describe('The prompt to improve'),
  promptId: z.string().optional().describe('Optional Langfuse prompt ID'),
  techniques: z.array(z.string()).optional().describe('Specific techniques to apply'),
  targetModel: z.enum(['claude', 'gpt', 'gemini']).optional()
    .describe('Target model for optimization (claude, gpt, gemini)'),
  enableModelOptimization: z.boolean().optional().default(true)
    .describe('Enable model-specific optimizations'),
});

export type ImproveInput = z.infer<typeof ImproveSchema>;

/**
 * Compare tool input validation schema
 */
export const CompareSchema = z.object({
  prompt1: z.string().min(1).describe('First prompt version'),
  prompt2: z.string().min(1).describe('Second prompt version'),
  promptId: z.string().optional().describe('Optional Langfuse prompt ID for versioning'),
});

export type CompareInput = z.infer<typeof CompareSchema>;

/**
 * Patterns tool input validation schema
 */
export const PatternsSchema = z.object({
  minScore: z.number().min(0).max(100).default(85)
    .describe('Minimum score for pattern extraction'),
  limit: z.number().min(1).max(1000).default(100)
    .describe('Number of prompts to analyze'),
});

export type PatternsInput = z.infer<typeof PatternsSchema>;

/**
 * Deploy tool input validation schema
 */
export const DeploySchema = z.object({
  promptId: z.string().min(1).describe('Prompt ID to deploy'),
  version: z.string().min(1).describe('Version to deploy'),
  label: z.string().default('production').describe('Deployment label'),
});

export type DeployInput = z.infer<typeof DeploySchema>;

/**
 * Save tool input validation schema (if needed)
 */
export const SaveSchema = z.object({
  originalPrompt: z.string().min(1).describe('Original prompt text'),
  improvedPrompt: z.string().min(1).describe('Improved prompt text'),
  originalScore: z.number().optional().describe('Original prompt score'),
  improvedScore: z.number().optional().describe('Improved prompt score'),
  techniquesApplied: z.array(z.string()).optional().describe('Techniques that were applied'),
  filename: z.string().optional().describe('Optional filename for saving'),
});

export type SaveInput = z.infer<typeof SaveSchema>;

/**
 * Generic validation function with better error messages
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown,
  toolName: string
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new Error(`Validation failed for ${toolName}: ${details}`);
    }
    throw error;
  }
}

/**
 * Schema registry for dynamic validation
 */
export const SchemaRegistry = {
  track: TrackSchema,
  evaluate: EvaluateSchema,
  improve: ImproveSchema,
  compare: CompareSchema,
  patterns: PatternsSchema,
  deploy: DeploySchema,
  save: SaveSchema,
} as const;

export type SchemaRegistryKey = keyof typeof SchemaRegistry;