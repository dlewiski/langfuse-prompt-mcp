/**
 * Evaluation Criteria Configuration
 * Defines scoring criteria for prompt quality assessment
 */

import { EvaluationCriterion } from '../types/domain.js';

export interface CriterionConfig {
  weight: number;
  minScore: number;
  maxScore: number;
  description: string;
  examples?: string[];
}

export const EVALUATION_CRITERIA: Record<EvaluationCriterion, CriterionConfig> = Object.freeze({
  clarity: {
    weight: 1.2,
    minScore: 0,
    maxScore: 10,
    description: 'How clear and unambiguous the prompt is',
    examples: ['Clear task objectives', 'Well-defined requirements'],
  },
  structure: {
    weight: 1.1,
    minScore: 0,
    maxScore: 10,
    description: 'Organization and logical flow of the prompt',
  },
  examples: {
    weight: 1.0,
    minScore: 0,
    maxScore: 10,
    description: 'Quality and relevance of provided examples',
  },
  chainOfThought: {
    weight: 1.1,
    minScore: 0,
    maxScore: 10,
    description: 'Step-by-step reasoning and thinking process',
  },
  techSpecificity: {
    weight: 1.2,
    minScore: 0,
    maxScore: 10,
    description: 'Technical details and specific requirements',
  },
  errorHandling: {
    weight: 1.0,
    minScore: 0,
    maxScore: 10,
    description: 'Consideration of edge cases and error scenarios',
  },
  performance: {
    weight: 0.9,
    minScore: 0,
    maxScore: 10,
    description: 'Performance requirements and optimization',
  },
  testing: {
    weight: 0.9,
    minScore: 0,
    maxScore: 10,
    description: 'Testing requirements and validation',
  },
  outputFormat: {
    weight: 1.0,
    minScore: 0,
    maxScore: 10,
    description: 'Clear specification of desired output format',
  },
  deployment: {
    weight: 0.8,
    minScore: 0,
    maxScore: 10,
    description: 'Deployment and production readiness',
  },
});