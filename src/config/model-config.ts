/**
 * Model Configuration
 * Defines settings and optimizations for different LLM models
 */

import { TargetModel } from '../types/domain.js';

export interface ModelConfiguration {
  name: string;
  provider: string;
  maxTokens: number;
  temperature: number;
  techniques: string[];
  specializations: string[];
  optimizationPriorities: string[];
}

export const MODEL_CONFIG: Record<TargetModel | 'generic' | 'universal', ModelConfiguration> = Object.freeze({
  claude: {
    name: 'Claude (Anthropic)',
    provider: 'anthropic',
    maxTokens: 100000,
    temperature: 0.7,
    techniques: ['xml_tags', 'thinking_tags', 'prefilling', 'artifacts'],
    specializations: ['reasoning', 'analysis', 'coding', 'safety'],
    optimizationPriorities: ['clarity', 'structure', 'safety'],
  },
  gpt: {
    name: 'GPT (OpenAI)',
    provider: 'openai',
    maxTokens: 128000,
    temperature: 0.7,
    techniques: ['system_message', 'function_calling', 'json_mode'],
    specializations: ['general', 'creative', 'technical'],
    optimizationPriorities: ['specificity', 'examples', 'structure'],
  },
  gemini: {
    name: 'Gemini (Google)',
    provider: 'google',
    maxTokens: 30720,
    temperature: 0.7,
    techniques: ['multi_turn', 'code_execution', 'grounding'],
    specializations: ['multimodal', 'reasoning', 'coding'],
    optimizationPriorities: ['context', 'examples', 'clarity'],
  },
  generic: {
    name: 'Generic LLM',
    provider: 'unknown',
    maxTokens: 4096,
    temperature: 0.7,
    techniques: ['basic_prompting'],
    specializations: ['general'],
    optimizationPriorities: ['clarity', 'structure', 'specificity'],
  },
  universal: {
    name: 'Universal (All Models)',
    provider: 'any',
    maxTokens: 4096,
    temperature: 0.7,
    techniques: ['basic_prompting', 'few_shot'],
    specializations: ['general'],
    optimizationPriorities: ['clarity', 'structure', 'specificity', 'examples'],
  },
});

export function getModelConfig(model: TargetModel | string): ModelConfiguration {
  const modelKey = model.toLowerCase() as TargetModel;
  return MODEL_CONFIG[modelKey] || MODEL_CONFIG.generic;
}