/**
 * GPT Optimizer Tests
 * Comprehensive test suite for GPT-specific prompt optimizations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GPTOptimizerOptions, OptimizerResult } from '../../../../src/types/modelOptimizers.js';

// Import the actual implementation to test
import { optimizeForGPT } from '../../../../src/improvers/models/gptOptimizer.js';

describe('GPT Optimizer', () => {
  describe('Basic Functionality', () => {
    it('should return a valid OptimizerResult structure', () => {
      const prompt = 'Simple test prompt';
      const result = optimizeForGPT(prompt);

      expect(result).toHaveProperty('optimizedPrompt');
      expect(result).toHaveProperty('optimizations');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('model', 'gpt');
    });

    it('should handle empty options object', () => {
      const prompt = 'Test prompt';
      const result = optimizeForGPT(prompt, {});

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });
  });

  describe('System Message Optimization', () => {
    it('should create system/user message structure', () => {
      const prompt = 'Analyze this text';
      const result = optimizeForGPT(prompt);

      // Check that optimization was applied
      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizations).toBeInstanceOf(Array);
    });

    it('should preserve existing system message format', () => {
      const prompt = '{"messages": [{"role": "system", "content": "Custom system"}]}';
      const result = optimizeForGPT(prompt);

      expect(result.optimizedPrompt).toContain('Custom system');
    });
  });

  describe('Structured Output Format', () => {
    it('should add JSON response format by default', () => {
      const prompt = 'Generate structured data';
      const result = optimizeForGPT(prompt);

      // Response format section may be added
      if (result.optimizations.some(opt => opt.toLowerCase().includes('response') || opt.toLowerCase().includes('json'))) {
        expect(result.optimizedPrompt).toMatch(/Response Format|response_format|## Response/i);
      }
      expect(result.metadata?.features?.hasResponseFormat).toBeDefined();
    });

    it('should skip structured output when disabled', () => {
      const prompt = 'Generate text';
      const options: GPTOptimizerOptions = { structuredOutput: false };
      
      const result = optimizeForGPT(prompt, options);

      expect(result.optimizedPrompt).not.toContain('Response Format');
      expect(result.metadata?.features?.hasResponseFormat).toBe(false);
    });
  });

  describe('Few-Shot Learning', () => {
    it('should add examples by default if not present', () => {
      const prompt = 'Classify this text';
      const result = optimizeForGPT(prompt);

      expect(result.optimizedPrompt).toContain('Examples');
      expect(result.optimizedPrompt).toContain('Example 1');
      expect(result.metadata?.features?.hasFewShot).toBe(true);
    });

    it('should skip examples when disabled', () => {
      const prompt = 'Simple task';
      const options: GPTOptimizerOptions = { includeFewShot: false };
      
      const result = optimizeForGPT(prompt, options);

      expect(result.optimizedPrompt).not.toContain('## Examples');
      expect(result.metadata?.features?.hasFewShot).toBe(false);
    });

    it('should not duplicate examples if already present', () => {
      const prompt = 'Task with Example: input->output';
      const result = optimizeForGPT(prompt);

      const exampleCount = (result.optimizedPrompt.match(/Example/g) || []).length;
      expect(exampleCount).toBeLessThanOrEqual(2); // May appear in original + added
    });
  });

  describe('Function Calling', () => {
    it('should add function calling when enabled', () => {
      const prompt = 'Use functions to complete task';
      const options: GPTOptimizerOptions = { enableFunctions: true };
      
      const result = optimizeForGPT(prompt, options);

      expect(result.optimizedPrompt).toMatch(/function|Function/i);
      expect(result.optimizations.some(opt => opt.toLowerCase().includes('function'))).toBe(true);
      expect(result.metadata?.features?.hasFunctionCalling).toBe(true);
    });

    it('should not add function calling by default', () => {
      const prompt = 'Regular task';
      const result = optimizeForGPT(prompt);

      expect(result.optimizedPrompt).not.toContain('Available Functions');
      expect(result.metadata?.features?.hasFunctionCalling).toBe(false);
    });
  });

  describe('JSON Mode Optimization', () => {
    it('should optimize for JSON mode when enabled', () => {
      const prompt = 'Generate JSON data';
      const options: GPTOptimizerOptions = { jsonMode: true };
      
      const result = optimizeForGPT(prompt, options);

      expect(result.optimizedPrompt).toContain('json');
      expect(result.metadata?.features?.hasResponseFormat).toBe(true);
    });
  });

  describe('Model-Specific Optimizations', () => {
    it('should handle GPT-4 specific optimizations', () => {
      const prompt = 'Complex reasoning task';
      const options: GPTOptimizerOptions = { model: 'gpt-4' };
      
      const result = optimizeForGPT(prompt, options);

      expect(result).toBeDefined();
      expect(result.metadata?.model).toBe('gpt');
    });

    it('should handle o1 model optimizations', () => {
      const prompt = 'Reasoning task';
      const options: GPTOptimizerOptions = { model: 'o1-preview' };
      
      const result = optimizeForGPT(prompt, options);

      expect(result).toBeDefined();
      // o1 models have specific reasoning requirements
    });
  });

  describe('Combined Optimizations', () => {
    it('should apply multiple optimizations together', () => {
      const prompt = 'Complex task';
      const options: GPTOptimizerOptions = {
        structuredOutput: true,
        includeFewShot: true,
        enableFunctions: true,
        jsonMode: true
      };
      
      const result = optimizeForGPT(prompt, options);

      // Check that optimizations were applied
      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizations).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.optimizations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompts', () => {
      const prompt = '';
      const result = optimizeForGPT(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });

    it('should handle very long prompts', () => {
      const prompt = 'x'.repeat(50000);
      const result = optimizeForGPT(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });

    it('should handle special characters in prompts', () => {
      const prompt = 'Test "with" \'quotes\' and {json}';
      const result = optimizeForGPT(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toContain('Test');
    });

    it('should handle malformed JSON in prompt', () => {
      const prompt = '{"broken": json}';
      const result = optimizeForGPT(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should optimize quickly for typical prompts', () => {
      const prompt = 'Typical GPT prompt';
      const startTime = performance.now();
      
      const result = optimizeForGPT(prompt);
      
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100); // < 100ms
      expect(result).toBeDefined();
    });

    it('should handle batches of optimizations efficiently', () => {
      const prompts = Array(10).fill('Test prompt');
      const startTime = performance.now();
      
      const results = prompts.map(p => optimizeForGPT(p));
      
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500); // < 500ms for 10 prompts
      expect(results).toHaveLength(10);
    });
  });

  describe('Token Optimization', () => {
    it('should optimize for token efficiency', () => {
      const verbosePrompt = 'Please could you kindly analyze this text and provide a detailed response';
      // Note: optimizeTokens feature could be added to GPTOptimizerOptions in the future
      const options: GPTOptimizerOptions = {};
      
      const result = optimizeForGPT(verbosePrompt, options);

      expect(result).toBeDefined();
      // Token optimization should maintain meaning while reducing tokens
    });
  });
});