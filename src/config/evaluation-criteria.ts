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
    weight: 1.5,
    minScore: 0,
    maxScore: 10,
    description: 'How clear and unambiguous the prompt is',
    examples: ['Clear task objectives', 'Well-defined requirements'],
  },
  specificity: {
    weight: 1.3,
    minScore: 0,
    maxScore: 10,
    description: 'Level of detail and specific requirements',
    examples: ['Specific output format', 'Detailed constraints'],
  },
  context_sufficiency: {
    weight: 1.2,
    minScore: 0,
    maxScore: 10,
    description: 'Adequacy of background information provided',
  },
  structure: {
    weight: 1.0,
    minScore: 0,
    maxScore: 10,
    description: 'Organization and logical flow of the prompt',
  },
  feasibility: {
    weight: 1.1,
    minScore: 0,
    maxScore: 10,
    description: 'Whether the task is achievable as specified',
  },
  edge_case_handling: {
    weight: 0.9,
    minScore: 0,
    maxScore: 10,
    description: 'Consideration of edge cases and error scenarios',
  },
  output_format: {
    weight: 0.8,
    minScore: 0,
    maxScore: 10,
    description: 'Clear specification of desired output format',
  },
  examples_quality: {
    weight: 1.0,
    minScore: 0,
    maxScore: 10,
    description: 'Quality and relevance of provided examples',
  },
  language_quality: {
    weight: 0.7,
    minScore: 0,
    maxScore: 10,
    description: 'Grammar, spelling, and language clarity',
  },
  technique_appropriateness: {
    weight: 1.2,
    minScore: 0,
    maxScore: 10,
    description: 'Use of appropriate prompting techniques',
  },
});