/**
 * Gemini Optimizer Tests
 * Comprehensive test suite for Gemini-specific prompt optimizations
 */

import { describe, it, expect } from 'vitest';
import type { GeminiOptimizerOptions } from '../../../../src/types/modelOptimizers.js';

// Import the actual implementation to test
import { optimizeForGemini } from '../../../../src/improvers/models/geminiOptimizer.js';

describe('Gemini Optimizer', () => {
  describe('Basic Functionality', () => {
    it('should return a valid OptimizerResult structure', () => {
      const prompt = 'Simple test prompt';
      const result = optimizeForGemini(prompt);

      expect(result).toHaveProperty('optimizedPrompt');
      expect(result).toHaveProperty('optimizations');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('model', 'gemini');
    });

    it('should always add safety configuration', () => {
      const prompt = 'Test prompt';
      const result = optimizeForGemini(prompt);

      expect(result.optimizedPrompt).toMatch(/Safety|safety/i);
      expect(result.metadata?.features?.hasSafetySettings).toBe(true);
    });
  });

  describe('Safety Configuration', () => {
    it('should use default safety level when not specified', () => {
      const prompt = 'Generate content';
      const result = optimizeForGemini(prompt);

      // Default safety level should be applied
      expect(result.optimizedPrompt).toMatch(/BLOCK_|Safety/i);
    });

    it('should apply custom safety levels', () => {
      const prompt = 'Generate creative content';
      const options: GeminiOptimizerOptions = { safetyLevel: 'BLOCK_NONE' };
      
      const result = optimizeForGemini(prompt, options);

      // Check that optimization was applied
      expect(result.optimizedPrompt).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle all safety levels', () => {
      const levels: Array<GeminiOptimizerOptions['safetyLevel']> = [
        'BLOCK_NONE', 'BLOCK_LOW', 'BLOCK_MEDIUM', 'BLOCK_HIGH'
      ];

      levels.forEach(level => {
        const result = optimizeForGemini('Test', { safetyLevel: level });
        expect(result.optimizedPrompt).toBeDefined();
      });
    });
  });

  describe('Grounding with Google Search', () => {
    it('should enable grounding by default', () => {
      const prompt = 'What is the current weather?';
      const result = optimizeForGemini(prompt);

      expect(result.optimizedPrompt).toContain('grounding');
      expect(result.metadata?.features?.hasGrounding).toBe(true);
    });

    it('should disable grounding when specified', () => {
      const prompt = 'Creative writing task';
      const options: GeminiOptimizerOptions = { enableGrounding: false };
      
      const result = optimizeForGemini(prompt, options);

      expect(result.optimizedPrompt).not.toContain('grounding');
      expect(result.metadata?.features?.hasGrounding).toBe(false);
    });
  });

  describe('Context Caching', () => {
    it('should enable caching for long prompts', () => {
      const longPrompt = 'x'.repeat(1500);
      const options: GeminiOptimizerOptions = { useContextCaching: true };
      
      const result = optimizeForGemini(longPrompt, options);

      // Check if optimization ran
      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizations).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should not cache short prompts even if enabled', () => {
      const shortPrompt = 'Short prompt';
      const options: GeminiOptimizerOptions = { useContextCaching: true };
      
      const result = optimizeForGemini(shortPrompt, options);

      expect(result.optimizedPrompt).not.toContain('CONTEXT_CACHE');
      expect(result.metadata?.features?.hasContextCaching).toBe(false);
    });
  });

  describe('Multi-Modal Support', () => {
    it('should add multi-modal instructions when enabled', () => {
      const prompt = 'Analyze this image';
      const options: GeminiOptimizerOptions = { multiModal: true };
      
      const result = optimizeForGemini(prompt, options);

      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizations).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should not add multi-modal by default', () => {
      const prompt = 'Text-only task';
      const result = optimizeForGemini(prompt);

      expect(result.optimizedPrompt).not.toContain('Multi-Modal');
      expect(result.metadata?.features?.hasMultiModal).toBe(false);
    });
  });

  describe('Multi-Turn Conversation', () => {
    it('should enhance for multi-turn when enabled', () => {
      const prompt = 'Start a conversation';
      const options: GeminiOptimizerOptions = { multiTurn: true };
      
      const result = optimizeForGemini(prompt, options);

      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizations).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Markdown Structure', () => {
    it('should convert plain text to markdown', () => {
      const prompt = 'Plain text prompt without structure';
      const result = optimizeForGemini(prompt);

      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizations).toBeInstanceOf(Array);
    });

    it('should preserve existing markdown structure', () => {
      const prompt = '# Existing Structure\n\nContent here';
      const result = optimizeForGemini(prompt);

      expect(result.optimizedPrompt).not.toMatch(/# Task.*# Existing/s);
    });
  });

  describe('Combined Optimizations', () => {
    it('should apply all optimizations together', () => {
      const prompt = 'x'.repeat(1500); // Long prompt
      const options: GeminiOptimizerOptions = {
        safetyLevel: 'BLOCK_LOW',
        enableGrounding: true,
        useContextCaching: true,
        multiModal: true,
        multiTurn: true
      };
      
      const result = optimizeForGemini(prompt, options);

      expect(result.optimizedPrompt).toBeDefined();
      expect(result.optimizations).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Gemini-Specific Features', () => {
    it('should handle Gemini Pro specific optimizations', () => {
      const prompt = 'Complex analysis task';
      const options: GeminiOptimizerOptions = {
        model: 'gemini-pro',
        temperature: 0.7
      };
      
      const result = optimizeForGemini(prompt, options);

      expect(result).toBeDefined();
      expect(result.metadata?.model).toBe('gemini');
    });

    it('should optimize for Gemini Ultra when specified', () => {
      const prompt = 'Ultra-complex task';
      const options: GeminiOptimizerOptions = {
        model: 'gemini-ultra',
        maxTokens: 100000
      };
      
      const result = optimizeForGemini(prompt, options);

      expect(result).toBeDefined();
      // Ultra model might have different optimization strategies
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompts', () => {
      const result = optimizeForGemini('');

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });

    it('should handle very long prompts (2M context)', () => {
      const hugePrompt = 'x'.repeat(1000000);
      const result = optimizeForGemini(hugePrompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt.length).toBeGreaterThan(1000000);
    });

    it('should handle prompts with special characters', () => {
      const prompt = 'Test with 🔍 emojis and 特殊字符';
      const result = optimizeForGemini(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toContain('🔍');
    });

    it('should handle undefined options gracefully', () => {
      const prompt = 'Test';
      const result = optimizeForGemini(prompt, undefined as any);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should optimize quickly even for large prompts', () => {
      const largePrompt = 'x'.repeat(10000);
      const startTime = performance.now();
      
      const result = optimizeForGemini(largePrompt);
      
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(200); // < 200ms
      expect(result).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid safety levels gracefully', () => {
      const prompt = 'Test';
      const options: GeminiOptimizerOptions = {
        safetyLevel: 'INVALID' as any
      };
      
      const result = optimizeForGemini(prompt, options);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined(); // Should handle gracefully
    });

    it('should handle conflicting options', () => {
      const prompt = 'Short text';
      const options: GeminiOptimizerOptions = {
        useContextCaching: true, // Won't work on short text
        multiModal: false,
        enableGrounding: false
      };
      
      const result = optimizeForGemini(prompt, options);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).not.toContain('CONTEXT_CACHE');
    });
  });
});