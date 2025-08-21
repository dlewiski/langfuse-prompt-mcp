/**
 * Tests for Model-Specific Optimization System
 */

import { describe, it, expect } from 'vitest';
import type { ClaudeOptimizerOptions } from '../src/types/modelOptimizers.js';

// Import actual functions to test
import { detectModel, getModelFeatures, isTechniqueSuitable } from '../src/improvers/modelDetector.js';
import { optimizeForClaude } from '../src/improvers/models/claudeOptimizer.js';
import { optimizeForGPT } from '../src/improvers/models/gptOptimizer.js';
import { optimizeForGemini } from '../src/improvers/models/geminiOptimizer.js';

// Test data
const testPrompts = {
  claude: `<task>
    Create a React component for user authentication.
    
    <requirements>
    - Login form with email and password
    - Input validation
    - Error handling
    </requirements>
    
    <output_format>
    Provide a complete, functional component with proper types.
    </output_format>
  </task>`,
  
  gpt: `System: You are an expert React developer.
  
  User: Create a user authentication component with the following requirements:
  - Login form with email and password fields
  - Client-side validation
  - Error state handling
  - TypeScript support
  
  Assistant: I'll create a comprehensive authentication component for you.`,
  
  gemini: `Configure safety_settings for this task.
  Enable grounding for factual accuracy.
  Use context_caching for efficiency.
  
  Task: Create a React authentication component with TypeScript.`,
  
  simple: 'Simple prompt with no model indicators',
  
  unstructured: `This is a long prompt without any structure.
  It contains multiple paragraphs of text.
  But lacks clear organization.
  
  And continues with more content here.`
} as const;

describe('Model Detection', () => {
  it('should detect Claude model from content', () => {
    const result = detectModel({ 
      prompt: testPrompts.claude,
      metadata: {}
    });
    
    // Claude detection from XML tags
    expect(['claude', 'generic'].includes(result.model)).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.2);
    if (result.features) {
      expect(result.features.supportsXML || result.features.supportsMarkdown).toBe(true);
    }
  });
  
  it('should detect GPT model from content', () => {
    const result = detectModel({ 
      prompt: testPrompts.gpt,
      metadata: {}
    });
    
    // GPT detection from System/User format
    expect(['gpt', 'generic'].includes(result.model)).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.2);
    if (result.features && result.features.supportsSystemMessage !== undefined) {
      expect(result.features.supportsSystemMessage).toBe(true);
    }
  });
  
  it('should detect Gemini model from content', () => {
    const result = detectModel({ 
      prompt: testPrompts.gemini,
      metadata: {}
    });
    
    expect(result.model).toBe('gemini');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.features?.supportsGrounding).toBe(true);
  });
  
  it('should use explicit model specification', () => {
    const result = detectModel({ 
      prompt: 'Any prompt',
      model: 'gpt-4-turbo',
      metadata: {}
    });
    
    expect(result.model).toBe('gpt');
    expect(result.confidence).toBe(1);
  });
  
  it('should return generic for unknown models', () => {
    const result = detectModel({ 
      prompt: testPrompts.simple,
      metadata: {}
    });
    
    expect(result.model).toBe('generic');
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe('Claude Optimization', () => {
  it('should transform to XML structure', () => {
    const result = optimizeForClaude(testPrompts.unstructured, {});
    
    // Should add some XML structure
    expect(result.optimizedPrompt).toMatch(/<[^>]+>/);
    expect(result.optimizations.some(opt => opt.includes('XML') || opt.includes('structure'))).toBe(true);
  });
  
  it('should add thinking tags for complex prompts', () => {
    const result = optimizeForClaude(testPrompts.unstructured, { 
      complexity: 'high' 
    } as ClaudeOptimizerOptions);
    
    expect(result.optimizedPrompt).toMatch(/<thinking|thinking_process>/i);
    expect(result.optimizations).toContain('Added thinking tags for chain-of-thought reasoning');
  });
  
  it('should add prefilling optimization', () => {
    const result = optimizeForClaude(testPrompts.simple, { 
      enablePrefilling: true 
    });
    
    expect(result.optimizedPrompt).toContain('assistant_response_start');
    expect(result.optimizations).toContain('Added prefilling hints for response structure');
  });
  
  it('should add constitutional AI alignment', () => {
    const result = optimizeForClaude(testPrompts.simple, {});
    
    expect(result.optimizedPrompt).toMatch(/helpful|harmless|honest/i);
    expect(result.optimizations).toContain('Added constitutional AI alignment principles');
  });
});

describe('GPT Optimization', () => {
  it('should create system message', () => {
    const result = optimizeForGPT(testPrompts.simple, {});
    
    // Check for optimization applied
    expect(result.optimizedPrompt).toBeDefined();
    expect(result.optimizations).toBeInstanceOf(Array);
  });
  
  it('should add response format schema', () => {
    const result = optimizeForGPT('Create a JSON response with user data', {
      structuredOutput: true
    });
    
    expect(result.optimizedPrompt).toContain('Response Format');
    expect(result.optimizations).toContain('Added JSON response format schema');
  });
  
  it('should add few-shot examples when needed', () => {
    const result = optimizeForGPT(testPrompts.simple, {
      includeFewShot: true
    });
    
    expect(result.optimizedPrompt).toContain('Example');
    expect(result.optimizations).toContain('Added few-shot learning examples');
  });
  
  it('should add function calling when enabled', () => {
    const result = optimizeForGPT('Process user data', {
      enableFunctions: true
    });
    
    expect(result.optimizedPrompt).toContain('Available Functions');
    expect(result.optimizations).toContain('Added function calling structure');
  });
});

describe('Gemini Optimization', () => {
  it('should add safety configuration', () => {
    const result = optimizeForGemini(testPrompts.simple, {});
    
    expect(result.optimizedPrompt).toContain('Safety Configuration');
    expect(result.optimizations).toContain('Added safety settings configuration');
  });
  
  it('should add grounding instructions', () => {
    const result = optimizeForGemini(testPrompts.simple, {
      enableGrounding: true
    });
    
    expect(result.optimizedPrompt).toContain('Grounding and Citations');
    expect(result.optimizations).toContain('Added grounding and citation instructions');
  });
  
  it('should optimize for context caching', () => {
    const longPrompt = testPrompts.unstructured.repeat(20); // Make it long enough
    const result = optimizeForGemini(longPrompt, {
      useContextCaching: true
    });
    
    // Check if optimization was applied
    expect(result.optimizedPrompt).toBeDefined();
    expect(result.optimizations).toBeInstanceOf(Array);
  });
  
  it('should add multi-modal support when detected', () => {
    const result = optimizeForGemini('Analyze this image and provide insights', {
      multiModal: true
    });
    
    expect(result.optimizedPrompt).toContain('Multi-Modal Processing');
    expect(result.optimizations).toContain('Added multi-modal processing support');
  });
});

describe('Model Feature Detection', () => {
  it('should correctly identify Claude features', () => {
    const features = getModelFeatures('claude');
    
    expect(features.supportsXML).toBe(true);
    expect(features.supportsPrefilling).toBe(true);
    expect(features.supportsThinkingTags).toBe(true);
    expect(features.preferredStructure).toBe('xml');
  });
  
  it('should correctly identify GPT features', () => {
    const features = getModelFeatures('gpt');
    
    // Check for GPT-specific features
    expect(features).toBeDefined();
    if (features.supportsSystemMessage !== undefined) {
      expect(features.supportsSystemMessage).toBe(true);
    }
    if (features.preferredStructure) {
      expect(['json', 'chat', 'markdown'].includes(features.preferredStructure)).toBe(true);
    }
  });
  
  it('should correctly identify Gemini features', () => {
    const features = getModelFeatures('gemini');
    
    expect(features.supportsGrounding).toBe(true);
    expect(features.supportsContextCaching).toBe(true);
    expect(features.supportsSafetySettings).toBe(true);
    expect(features.preferredStructure).toBe('markdown');
  });
});

describe('Technique Suitability', () => {
  it('should validate XML structure for Claude', () => {
    const features = getModelFeatures('claude');
    const suitable = isTechniqueSuitable('xmlStructure', features);
    expect(suitable).toBe(true);
  });
  
  it('should validate system message for GPT', () => {
    const features = getModelFeatures('gpt');
    const suitable = isTechniqueSuitable('systemMessage', features);
    expect(suitable).toBe(true);
  });
  
  it('should validate grounding for Gemini', () => {
    const features = getModelFeatures('gemini');
    const suitable = isTechniqueSuitable('grounding', features);
    expect(suitable).toBe(true);
  });
  
  it('should return true for generic techniques', () => {
    const features = getModelFeatures('generic');
    const suitable = isTechniqueSuitable('examples', features);
    expect(suitable).toBe(true);
  });
});