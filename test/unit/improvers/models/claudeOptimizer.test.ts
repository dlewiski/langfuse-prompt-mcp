/**
 * Claude Optimizer Tests
 * Comprehensive test suite for Claude-specific prompt optimizations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ClaudeOptimizerOptions, OptimizerResult } from '../../../../src/types/modelOptimizers.js';

// Import the actual implementation to test
import { optimizeForClaude } from '../../../../src/improvers/models/claudeOptimizer.js';

describe('Claude Optimizer', () => {
  describe('Basic Functionality', () => {
    it('should return a valid OptimizerResult structure', () => {
      const prompt = 'Simple test prompt';
      const result = optimizeForClaude(prompt);

      expect(result).toHaveProperty('optimizedPrompt');
      expect(result).toHaveProperty('optimizations');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('model', 'claude');
    });

    it('should preserve the original prompt when no optimizations needed', () => {
      const prompt = '<task>Already formatted prompt</task>';
      const result = optimizeForClaude(prompt);

      expect(result.optimizedPrompt).toContain('Already formatted prompt');
    });
  });

  describe('XML Structure Transformation', () => {
    it('should add XML structure to plain text prompts', () => {
      const prompt = 'Analyze this data and provide insights';
      const result = optimizeForClaude(prompt);

      // Check for XML structure (could be <role>, <task>, or other XML tags)
      expect(result.optimizedPrompt).toMatch(/<[^>]+>/);
      expect(result.optimizations.some(opt => opt.includes('XML') || opt.includes('structure'))).toBe(true);
    });

    it('should not add XML structure if already present', () => {
      const prompt = '<analysis>Analyze this data</analysis>';
      const result = optimizeForClaude(prompt);

      expect(result.optimizedPrompt).not.toMatch(/<task>.*<analysis>/s);
    });
  });

  describe('Thinking Tags for Complex Reasoning', () => {
    it('should add thinking tags for high complexity prompts', () => {
      const prompt = 'Complex multi-step analysis';
      const options: ClaudeOptimizerOptions = { complexity: 'high' };
      
      const result = optimizeForClaude(prompt, options);

      expect(result.optimizedPrompt.toLowerCase()).toMatch(/<thinking|thinking_process/);
      expect(result.optimizations.some(opt => opt.toLowerCase().includes('thinking'))).toBe(true);
      expect(result.metadata?.features?.usesThinking).toBe(true);
    });

    it('should not add thinking tags for low complexity', () => {
      const prompt = 'Simple question';
      const options: ClaudeOptimizerOptions = { complexity: 'low' };
      
      const result = optimizeForClaude(prompt, options);

      expect(result.optimizedPrompt).not.toContain('<thinking>');
      expect(result.metadata?.features?.usesThinking).toBe(false);
    });
  });

  describe('Prefilling Optimization', () => {
    it('should add prefilling by default', () => {
      const prompt = 'Generate a response';
      const result = optimizeForClaude(prompt);

      expect(result.optimizedPrompt).toMatch(/Assistant:|I'll|I will/);
      expect(result.metadata?.features?.usesPrefilling).toBe(true);
    });

    it('should skip prefilling when explicitly disabled', () => {
      const prompt = 'Generate a response';
      const options: ClaudeOptimizerOptions = { enablePrefilling: false };
      
      const result = optimizeForClaude(prompt, options);

      expect(result.optimizedPrompt).not.toContain('Assistant:');
      expect(result.metadata?.features?.usesPrefilling).toBe(false);
    });
  });

  describe('Artifact Generation Support', () => {
    it('should add artifact support when requested', () => {
      const prompt = 'Write a Python function';
      const options: ClaudeOptimizerOptions = { generateArtifacts: true };
      
      const result = optimizeForClaude(prompt, options);

      expect(result.optimizedPrompt.toLowerCase()).toContain('artifact');
      expect(result.optimizations.some(opt => opt.toLowerCase().includes('artifact'))).toBe(true);
      expect(result.metadata?.features?.usesArtifacts).toBe(true);
    });

    it('should not add artifact support by default', () => {
      const prompt = 'Explain a concept';
      const result = optimizeForClaude(prompt);

      expect(result.optimizedPrompt).not.toContain('artifact_instructions');
      expect(result.metadata?.features?.usesArtifacts).toBe(false);
    });
  });

  describe('Combined Optimizations', () => {
    it('should apply multiple optimizations together', () => {
      const prompt = 'Solve this complex problem';
      const options: ClaudeOptimizerOptions = {
        complexity: 'high',
        generateArtifacts: true,
        enablePrefilling: true
      };
      
      const result = optimizeForClaude(prompt, options);

      expect(result.optimizedPrompt.toLowerCase()).toMatch(/<thinking|thinking_process/);
      expect(result.optimizedPrompt).toMatch(/<[^>]+>/);
      expect(result.optimizedPrompt).toMatch(/Assistant:|I'll|I will/);
      expect(result.optimizedPrompt.toLowerCase()).toContain('artifact');
      expect(result.optimizations.length).toBeGreaterThan(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompts gracefully', () => {
      const prompt = '';
      const result = optimizeForClaude(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });

    it('should handle very long prompts', () => {
      const prompt = 'x'.repeat(100000);
      const result = optimizeForClaude(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt.length).toBeGreaterThan(100000);
    });

    it('should handle prompts with special characters', () => {
      const prompt = 'Test with <>&"\'`@#$%^&*()[]{}|\\';
      const result = optimizeForClaude(prompt);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toContain('Test with');
    });

    it('should handle undefined options', () => {
      const prompt = 'Test prompt';
      const result = optimizeForClaude(prompt, undefined as any);

      expect(result).toBeDefined();
      expect(result.optimizedPrompt).toBeDefined();
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete optimization quickly for typical prompts', () => {
      const prompt = 'Typical prompt with moderate complexity';
      const startTime = performance.now();
      
      const result = optimizeForClaude(prompt);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete in < 100ms
      expect(result).toBeDefined();
    });
  });
});