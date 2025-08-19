/**
 * Tests for Model-Specific Optimization System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { TargetModel } from '../src/types/domain';

// Type definitions for test data
interface ModelDetectionResult {
  detectedModel: TargetModel | 'generic';
  confidence: number;
  features: {
    supportsXML?: boolean;
    supportsSystemMessage?: boolean;
    supportsGrounding?: boolean;
    supportsContextCaching?: boolean;
    supportsMultiModal?: boolean;
  };
}

interface BaseImprovementResult {
  improved: string;
  improvements: string[];
  baseScore: number;
}

interface ModelOptimizationResult {
  prompt: string;
  optimizations: string[];
  score?: number;
}

interface OptimizationOptions {
  targetModel?: TargetModel;
  model?: string;
  complexity?: 'low' | 'medium' | 'high';
  includeFewShot?: boolean;
  useContextCaching?: boolean;
}

interface FullOptimizationResult {
  model: TargetModel | 'generic';
  confidence: number;
  optimized: string;
  improvements: {
    base: string[];
    modelSpecific: string[];
  };
  metrics: {
    estimatedScore: number;
    originalLength: number;
    optimizedLength: number;
    improvementCount: number;
  };
  summary: string;
  error?: string;
}

// Mock function types
type DetectModelFunction = (input: { prompt: string; model?: string }) => ModelDetectionResult;
type GetModelFeaturesFunction = (model: TargetModel | 'generic') => ModelDetectionResult['features'];
type IsTechniqueSuitableFunction = (technique: string, model: TargetModel | 'generic') => boolean;
type ApplyBaseImprovementsFunction = (prompt: string) => BaseImprovementResult;
type AnalyzeImprovementOpportunitiesFunction = (prompt: string) => string[];
type OptimizeForClaudeFunction = (prompt: string, options?: OptimizationOptions) => ModelOptimizationResult;
type OptimizeForGPTFunction = (prompt: string, options?: OptimizationOptions) => ModelOptimizationResult;
type OptimizeForGeminiFunction = (prompt: string, options?: OptimizationOptions) => ModelOptimizationResult;
type OptimizePromptFunction = (prompt: string, options?: OptimizationOptions) => Promise<FullOptimizationResult>;

// Import functions with proper typing
import { 
  detectModel, 
  getModelFeatures,
  isTechniqueSuitable 
} from '../src/improvers/modelDetector.js';
import { 
  applyBaseImprovements,
  analyzeImprovementOpportunities 
} from '../src/improvers/baseOptimizer.js';
import { optimizeForClaude } from '../src/improvers/models/claudeOptimizer.js';
import { optimizeForGPT } from '../src/improvers/models/gptOptimizer.js';
import { optimizeForGemini } from '../src/improvers/models/geminiOptimizer.js';
import { optimizePrompt } from '../src/improvers/modelOptimizer.js';

// Test data with explicit types
const testPrompts = {
  claude: `<task>
    Generate a Python function
  </task>
  <thinking>
    Consider edge cases
  </thinking>`,
  
  gpt: `System message: You are a helpful assistant.
  
  User: Generate a function with the following response_format:
  {
    "type": "json_object"
  }`,
  
  gemini: `Configure safety_settings for this task.
  Enable grounding for factual accuracy.
  Use context_caching for efficiency.`,
  
  simple: 'Simple prompt with no model indicators',
  
  unstructured: `This is a long prompt without any structure.
  It contains multiple paragraphs of text.
  But lacks clear organization.
  
  And continues with more content here.`
} as const;

describe('Model Detection', () => {
  it('should detect Claude model from content', () => {
    const result: ModelDetectionResult = (detectModel as DetectModelFunction)({ 
      prompt: testPrompts.claude 
    });
    
    expect(result.detectedModel).toBe('claude');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.features.supportsXML).toBe(true);
  });
  
  it('should detect GPT model from content', () => {
    const result: ModelDetectionResult = (detectModel as DetectModelFunction)({ 
      prompt: testPrompts.gpt 
    });
    
    expect(result.detectedModel).toBe('gpt');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.features.supportsSystemMessage).toBe(true);
  });
  
  it('should detect Gemini model from content', () => {
    const result: ModelDetectionResult = (detectModel as DetectModelFunction)({ 
      prompt: testPrompts.gemini 
    });
    
    expect(result.detectedModel).toBe('gemini');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.features.supportsGrounding).toBe(true);
  });
  
  it('should use explicit model specification', () => {
    const result: ModelDetectionResult = (detectModel as DetectModelFunction)({ 
      prompt: 'Any prompt',
      model: 'gpt-4-turbo'
    });
    
    expect(result.detectedModel).toBe('gpt');
    expect(result.confidence).toBe(0.95);
  });
  
  it('should return generic for unknown models', () => {
    const result: ModelDetectionResult = (detectModel as DetectModelFunction)({ 
      prompt: testPrompts.simple
    });
    
    expect(result.detectedModel).toBe('generic');
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe('Base Improvements', () => {
  it('should enhance task clarity', () => {
    const prompt = 'Generate a function to sort a list';
    const result: BaseImprovementResult = (applyBaseImprovements as ApplyBaseImprovementsFunction)(prompt);
    
    expect(result.improved).toContain('Task:');
    expect(result.improvements).toContain('Enhanced task clarity');
  });
  
  it('should add structure to unstructured prompts', () => {
    const result: BaseImprovementResult = (applyBaseImprovements as ApplyBaseImprovementsFunction)(
      testPrompts.unstructured
    );
    
    expect(result.improved).toMatch(/##\s+\w+/);
    expect(result.improvements).toContain('Added clear section structure');
  });
  
  it('should add input/output specifications', () => {
    const prompt = 'Create a function';
    const result: BaseImprovementResult = (applyBaseImprovements as ApplyBaseImprovementsFunction)(prompt);
    
    expect(result.improved).toContain('Input');
    expect(result.improved).toContain('Expected Output');
    expect(result.improvements).toContain('Clarified input/output specifications');
  });
  
  it('should add error handling instructions', () => {
    const prompt = 'Process data from API';
    const result: BaseImprovementResult = (applyBaseImprovements as ApplyBaseImprovementsFunction)(prompt);
    
    expect(result.improved).toContain('Error Handling');
    expect(result.improvements).toContain('Added error handling instructions');
  });
  
  it('should calculate base score', () => {
    const prompt = 'Simple prompt';
    const result: BaseImprovementResult = (applyBaseImprovements as ApplyBaseImprovementsFunction)(prompt);
    
    expect(result.baseScore).toBeGreaterThan(50);
    expect(result.baseScore).toBeLessThanOrEqual(85);
  });
});

describe('Claude Optimization', () => {
  it('should transform to XML structure', () => {
    const prompt = `Task: Generate code
    Context: Python function
    Requirements: Handle errors`;
    
    const result: ModelOptimizationResult = (optimizeForClaude as OptimizeForClaudeFunction)(prompt);
    
    expect(result.prompt).toContain('<task>');
    expect(result.prompt).toContain('<context>');
    expect(result.prompt).toContain('<requirements>');
    expect(result.optimizations).toContain('Converted to XML structure');
  });
  
  it('should add thinking tags for complex prompts', () => {
    const prompt = 'Design a complex system architecture';
    const result: ModelOptimizationResult = (optimizeForClaude as OptimizeForClaudeFunction)(
      prompt, 
      { complexity: 'high' }
    );
    
    expect(result.prompt).toContain('<thinking');
    expect(result.optimizations).toContain('Added thinking tags');
  });
  
  it('should add prefilling optimization', () => {
    const prompt = 'Generate a solution';
    const result: ModelOptimizationResult = (optimizeForClaude as OptimizeForClaudeFunction)(prompt);
    
    expect(result.prompt).toContain('assistant_response_start');
    expect(result.optimizations).toContain('Added prefilling hints');
  });
});

describe('GPT Optimization', () => {
  it('should create system message', () => {
    const prompt = `You are an expert developer.
    
    Create a function to process data.`;
    
    const result: ModelOptimizationResult = (optimizeForGPT as OptimizeForGPTFunction)(prompt);
    
    expect(result.prompt).toContain('"role": "system"');
    expect(result.prompt).toContain('"role": "user"');
    expect(result.optimizations).toContain('Created optimized system message');
  });
  
  it('should add response format schema', () => {
    const prompt = 'Return the result as JSON';
    const result: ModelOptimizationResult = (optimizeForGPT as OptimizeForGPTFunction)(prompt);
    
    expect(result.prompt).toContain('Response Format');
    expect(result.prompt).toContain('json_object');
    expect(result.optimizations).toContain('Added JSON response format');
  });
  
  it('should add few-shot examples', () => {
    const prompt = 'Process input';
    const result: ModelOptimizationResult = (optimizeForGPT as OptimizeForGPTFunction)(
      prompt, 
      { includeFewShot: true }
    );
    
    expect(result.prompt).toContain('Example');
    expect(result.optimizations).toContain('Added few-shot learning examples');
  });
  
  it('should add o1 reasoning for o1 models', () => {
    const prompt = 'Solve this problem';
    const result: ModelOptimizationResult = (optimizeForGPT as OptimizeForGPTFunction)(
      prompt, 
      { model: 'o1-preview' }
    );
    
    expect(result.prompt).toContain('Reasoning Process');
    expect(result.optimizations).toContain('Added o1 model reasoning structure');
  });
});

describe('Gemini Optimization', () => {
  it('should add safety configuration', () => {
    const prompt = 'Generate content';
    const result: ModelOptimizationResult = (optimizeForGemini as OptimizeForGeminiFunction)(prompt);
    
    expect(result.prompt).toContain('Safety Configuration');
    expect(result.prompt).toContain('HARM_CATEGORY');
    expect(result.optimizations).toContain('Added safety settings configuration');
  });
  
  it('should add grounding instructions', () => {
    const prompt = 'Provide factual information';
    const result: ModelOptimizationResult = (optimizeForGemini as OptimizeForGeminiFunction)(prompt);
    
    expect(result.prompt).toContain('Grounding and Citations');
    expect(result.optimizations).toContain('Added grounding and citation instructions');
  });
  
  it('should optimize for context caching', () => {
    const longPrompt = 'a'.repeat(3000); // Long prompt
    const result: ModelOptimizationResult = (optimizeForGemini as OptimizeForGeminiFunction)(
      longPrompt, 
      { useContextCaching: true }
    );
    
    expect(result.prompt).toContain('Cached Context');
    expect(result.prompt).toContain('Dynamic Content');
    expect(result.optimizations).toContain('Optimized for context caching');
  });
  
  it('should add multi-modal support', () => {
    const prompt = 'Analyze this image and provide insights';
    const result: ModelOptimizationResult = (optimizeForGemini as OptimizeForGeminiFunction)(prompt);
    
    expect(result.prompt).toContain('Multi-Modal Processing');
    expect(result.optimizations).toContain('Added multi-modal processing support');
  });
});

describe('Full Optimization Pipeline', () => {
  it('should apply both base and model-specific improvements', async () => {
    const prompt = 'Create a function to sort a list';
    const result: FullOptimizationResult = await (optimizePrompt as OptimizePromptFunction)(
      prompt, 
      { targetModel: 'claude' }
    );
    
    expect(result.model).toBe('claude');
    expect(result.improvements.base.length).toBeGreaterThan(0);
    expect(result.improvements.modelSpecific.length).toBeGreaterThan(0);
    expect(result.metrics.estimatedScore).toBeGreaterThan(70);
  });
  
  it('should auto-detect model and optimize', async () => {
    const prompt = '<task>Generate code</task>';
    const result: FullOptimizationResult = await (optimizePrompt as OptimizePromptFunction)(prompt);
    
    expect(result.model).toBe('claude');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.optimized).toContain('<');
  });
  
  it('should handle unknown models gracefully', async () => {
    const prompt = 'Simple prompt';
    const result: FullOptimizationResult = await (optimizePrompt as OptimizePromptFunction)(prompt);
    
    expect(result.model).toBe('generic');
    expect(result.error).toBeUndefined();
    expect(result.optimized).not.toBe(prompt);
  });
  
  it('should generate optimization summary', async () => {
    const prompt = 'Test prompt';
    const result: FullOptimizationResult = await (optimizePrompt as OptimizePromptFunction)(
      prompt, 
      { targetModel: 'gpt' }
    );
    
    expect(result.summary).toContain('Model Detection: gpt');
    expect(result.summary).toContain('Estimated Score:');
  });
  
  it('should calculate accurate metrics', async () => {
    const prompt = 'Short prompt';
    const result: FullOptimizationResult = await (optimizePrompt as OptimizePromptFunction)(prompt);
    
    expect(result.metrics.originalLength).toBe(prompt.length);
    expect(result.metrics.optimizedLength).toBeGreaterThan(0);
    expect(result.metrics.improvementCount).toBeGreaterThan(0);
  });
});

// Type guard functions for runtime validation
function isModelDetectionResult(value: unknown): value is ModelDetectionResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'detectedModel' in value &&
    'confidence' in value &&
    'features' in value
  );
}

function isBaseImprovementResult(value: unknown): value is BaseImprovementResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'improved' in value &&
    'improvements' in value &&
    'baseScore' in value
  );
}

function isFullOptimizationResult(value: unknown): value is FullOptimizationResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'model' in value &&
    'optimized' in value &&
    'improvements' in value &&
    'metrics' in value
  );
}