/**
 * Tests for Model-Specific Optimization System
 */

import { describe, it, expect } from '@jest/globals';
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

describe('Model Detection', () => {
  it('should detect Claude model from content', () => {
    const prompt = `<task>
      Generate a Python function
    </task>
    <thinking>
      Consider edge cases
    </thinking>`;
    
    const result = detectModel({ prompt });
    expect(result.detectedModel).toBe('claude');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.features.supportsXML).toBe(true);
  });
  
  it('should detect GPT model from content', () => {
    const prompt = `System message: You are a helpful assistant.
    
    User: Generate a function with the following response_format:
    {
      "type": "json_object"
    }`;
    
    const result = detectModel({ prompt });
    expect(result.detectedModel).toBe('gpt');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.features.supportsSystemMessage).toBe(true);
  });
  
  it('should detect Gemini model from content', () => {
    const prompt = `Configure safety_settings for this task.
    Enable grounding for factual accuracy.
    Use context_caching for efficiency.`;
    
    const result = detectModel({ prompt });
    expect(result.detectedModel).toBe('gemini');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.features.supportsGrounding).toBe(true);
  });
  
  it('should use explicit model specification', () => {
    const result = detectModel({ 
      prompt: 'Any prompt',
      model: 'gpt-4-turbo'
    });
    expect(result.detectedModel).toBe('gpt');
    expect(result.confidence).toBe(0.95);
  });
  
  it('should return generic for unknown models', () => {
    const result = detectModel({ 
      prompt: 'Simple prompt with no model indicators'
    });
    expect(result.detectedModel).toBe('generic');
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe('Base Improvements', () => {
  it('should enhance task clarity', () => {
    const prompt = 'Generate a function to sort a list';
    const result = applyBaseImprovements(prompt);
    
    expect(result.improved).toContain('Task:');
    expect(result.improvements).toContain('Enhanced task clarity');
  });
  
  it('should add structure to unstructured prompts', () => {
    const prompt = `This is a long prompt without any structure.
    It contains multiple paragraphs of text.
    But lacks clear organization.
    
    And continues with more content here.`;
    
    const result = applyBaseImprovements(prompt);
    expect(result.improved).toMatch(/##\s+\w+/);
    expect(result.improvements).toContain('Added clear section structure');
  });
  
  it('should add input/output specifications', () => {
    const prompt = 'Create a function';
    const result = applyBaseImprovements(prompt);
    
    expect(result.improved).toContain('Input');
    expect(result.improved).toContain('Expected Output');
    expect(result.improvements).toContain('Clarified input/output specifications');
  });
  
  it('should add error handling instructions', () => {
    const prompt = 'Process data from API';
    const result = applyBaseImprovements(prompt);
    
    expect(result.improved).toContain('Error Handling');
    expect(result.improvements).toContain('Added error handling instructions');
  });
  
  it('should calculate base score', () => {
    const prompt = 'Simple prompt';
    const result = applyBaseImprovements(prompt);
    
    expect(result.baseScore).toBeGreaterThan(50);
    expect(result.baseScore).toBeLessThanOrEqual(85);
  });
});

describe('Claude Optimization', () => {
  it('should transform to XML structure', () => {
    const prompt = `Task: Generate code
    Context: Python function
    Requirements: Handle errors`;
    
    const result = optimizeForClaude(prompt);
    
    expect(result.prompt).toContain('<task>');
    expect(result.prompt).toContain('<context>');
    expect(result.prompt).toContain('<requirements>');
    expect(result.optimizations).toContain('Converted to XML structure');
  });
  
  it('should add thinking tags for complex prompts', () => {
    const prompt = 'Design a complex system architecture';
    const result = optimizeForClaude(prompt, { complexity: 'high' });
    
    expect(result.prompt).toContain('<thinking');
    expect(result.optimizations).toContain('Added thinking tags');
  });
  
  it('should add prefilling optimization', () => {
    const prompt = 'Generate a solution';
    const result = optimizeForClaude(prompt);
    
    expect(result.prompt).toContain('assistant_response_start');
    expect(result.optimizations).toContain('Added prefilling hints');
  });
});

describe('GPT Optimization', () => {
  it('should create system message', () => {
    const prompt = `You are an expert developer.
    
    Create a function to process data.`;
    
    const result = optimizeForGPT(prompt);
    
    expect(result.prompt).toContain('"role": "system"');
    expect(result.prompt).toContain('"role": "user"');
    expect(result.optimizations).toContain('Created optimized system message');
  });
  
  it('should add response format schema', () => {
    const prompt = 'Return the result as JSON';
    const result = optimizeForGPT(prompt);
    
    expect(result.prompt).toContain('Response Format');
    expect(result.prompt).toContain('json_object');
    expect(result.optimizations).toContain('Added JSON response format');
  });
  
  it('should add few-shot examples', () => {
    const prompt = 'Process input';
    const result = optimizeForGPT(prompt, { includeFewShot: true });
    
    expect(result.prompt).toContain('Example');
    expect(result.optimizations).toContain('Added few-shot learning examples');
  });
  
  it('should add o1 reasoning for o1 models', () => {
    const prompt = 'Solve this problem';
    const result = optimizeForGPT(prompt, { model: 'o1-preview' });
    
    expect(result.prompt).toContain('Reasoning Process');
    expect(result.optimizations).toContain('Added o1 model reasoning structure');
  });
});

describe('Gemini Optimization', () => {
  it('should add safety configuration', () => {
    const prompt = 'Generate content';
    const result = optimizeForGemini(prompt);
    
    expect(result.prompt).toContain('Safety Configuration');
    expect(result.prompt).toContain('HARM_CATEGORY');
    expect(result.optimizations).toContain('Added safety settings configuration');
  });
  
  it('should add grounding instructions', () => {
    const prompt = 'Provide factual information';
    const result = optimizeForGemini(prompt);
    
    expect(result.prompt).toContain('Grounding and Citations');
    expect(result.optimizations).toContain('Added grounding and citation instructions');
  });
  
  it('should optimize for context caching', () => {
    const longPrompt = 'a'.repeat(3000); // Long prompt
    const result = optimizeForGemini(longPrompt, { useContextCaching: true });
    
    expect(result.prompt).toContain('Cached Context');
    expect(result.prompt).toContain('Dynamic Content');
    expect(result.optimizations).toContain('Optimized for context caching');
  });
  
  it('should add multi-modal support', () => {
    const prompt = 'Analyze this image and provide insights';
    const result = optimizeForGemini(prompt);
    
    expect(result.prompt).toContain('Multi-Modal Processing');
    expect(result.optimizations).toContain('Added multi-modal processing support');
  });
});

describe('Full Optimization Pipeline', () => {
  it('should apply both base and model-specific improvements', async () => {
    const prompt = 'Create a function to sort a list';
    const result = await optimizePrompt(prompt, { targetModel: 'claude' });
    
    expect(result.model).toBe('claude');
    expect(result.improvements.base.length).toBeGreaterThan(0);
    expect(result.improvements.modelSpecific.length).toBeGreaterThan(0);
    expect(result.metrics.estimatedScore).toBeGreaterThan(70);
  });
  
  it('should auto-detect model and optimize', async () => {
    const prompt = '<task>Generate code</task>';
    const result = await optimizePrompt(prompt);
    
    expect(result.model).toBe('claude');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.optimized).toContain('<');
  });
  
  it('should handle unknown models gracefully', async () => {
    const prompt = 'Simple prompt';
    const result = await optimizePrompt(prompt);
    
    expect(result.model).toBe('generic');
    expect(result.error).toBeUndefined();
    expect(result.optimized).not.toBe(prompt);
  });
  
  it('should generate optimization summary', async () => {
    const prompt = 'Test prompt';
    const result = await optimizePrompt(prompt, { targetModel: 'gpt' });
    
    expect(result.summary).toContain('Model Detection: gpt');
    expect(result.summary).toContain('Estimated Score:');
  });
  
  it('should calculate accurate metrics', async () => {
    const prompt = 'Short prompt';
    const result = await optimizePrompt(prompt);
    
    expect(result.metrics.originalLength).toBe(prompt.length);
    expect(result.metrics.optimizedLength).toBeGreaterThan(0);
    expect(result.metrics.improvementCount).toBeGreaterThan(0);
  });
});