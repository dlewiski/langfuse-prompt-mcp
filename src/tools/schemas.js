import { z } from 'zod';

export const EvaluateSchema = z.object({
  prompt: z.string().describe('The prompt to evaluate'),
  promptId: z.string().optional().describe('Optional Langfuse prompt ID'),
});

export const ImproveSchema = z.object({
  prompt: z.string().describe('The prompt to improve'),
  promptId: z.string().optional().describe('Optional Langfuse prompt ID'),
  techniques: z.array(z.string()).optional().describe('Specific techniques to apply'),
  targetModel: z.string().optional().describe('Target model for optimization (claude, gpt, gemini)'),
  enableModelOptimization: z.boolean().optional().default(true).describe('Enable model-specific optimizations'),
});

export const CompareSchema = z.object({
  prompt1: z.string().describe('First prompt version'),
  prompt2: z.string().describe('Second prompt version'),
  promptId: z.string().optional().describe('Optional Langfuse prompt ID for versioning'),
});

export const PatternsSchema = z.object({
  minScore: z.number().default(85).describe('Minimum score for pattern extraction'),
  limit: z.number().default(100).describe('Number of prompts to analyze'),
});

export const DeploySchema = z.object({
  promptId: z.string().describe('Prompt ID to deploy'),
  version: z.string().describe('Version to deploy'),
  label: z.string().default('production').describe('Deployment label'),
});