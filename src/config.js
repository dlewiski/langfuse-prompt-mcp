import { Langfuse } from 'langfuse';
import dotenv from 'dotenv';

// Load environment variables from .claude directory
dotenv.config({ path: `${process.env.HOME}/.claude/.env` });

// Initialize Langfuse client
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'http://localhost:3000',
});

// Evaluation criteria with weights
export const EVALUATION_CRITERIA = {
  clarity: { weight: 1.2, description: 'Unambiguous instructions' },
  structure: { weight: 1.1, description: 'XML tags and organization' },
  examples: { weight: 1.0, description: '2-3 examples with reasoning' },
  chainOfThought: { weight: 1.1, description: 'Explicit thinking sections' },
  techSpecificity: { weight: 1.2, description: 'Framework-specific patterns' },
  errorHandling: { weight: 1.0, description: 'Comprehensive scenarios' },
  performance: { weight: 0.9, description: 'Optimization mentions' },
  testing: { weight: 0.9, description: 'Test specifications' },
  outputFormat: { weight: 1.0, description: 'Clear structure definition' },
  deployment: { weight: 0.8, description: 'Production considerations' },
};

// Configuration constants
export const CONFIG = {
  MIN_IMPROVEMENT_SCORE: parseInt(process.env.MIN_IMPROVEMENT_SCORE) || 85,
  MAX_ITERATIONS: parseInt(process.env.MAX_ITERATIONS) || 5,
  PATTERN_MIN_SCORE: parseInt(process.env.PATTERN_MIN_SCORE) || 80,
  PATTERN_MIN_OCCURRENCES: parseInt(process.env.PATTERN_MIN_OCCURRENCES) || 3,
  USE_LLM_JUDGE: process.env.USE_LLM_JUDGE !== 'false', // Default to true
  LLM_MODEL: process.env.LLM_MODEL || 'claude-sonnet-4', // Default to Sonnet 4
};