/**
 * Unit Tests for Improve Handler
 * 
 * Tests the prompt improvement handler functionality including:
 * - Technique application
 * - Model-specific optimization
 * - Iterative improvement
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleImprove } from '../../../src/handlers/improve.js';
import { evaluatePrompt } from '../../../src/evaluators/index.js';
import { applyImprovements } from '../../../src/improvers/index.js';
import { optimizePrompt } from '../../../src/improvers/modelOptimizer.js';

// Mock dependencies
vi.mock('../../../src/evaluators/index.js');
vi.mock('../../../src/improvers/index.js');
vi.mock('../../../src/improvers/modelOptimizer.js');
vi.mock('../../../src/utils/logger.js', () => ({
  serverLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('handleImprove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic improvement', () => {
    it('should improve a prompt with default techniques', async () => {
      const mockEvaluation = {
        overallScore: 60,
        scores: {
          clarity: { score: 0.6, weight: 1.2, feedback: 'Needs improvement' },
          examples: { score: 0.4, weight: 1.0, feedback: 'Lacks examples' },
        },
        recommendations: ['Add examples', 'Improve clarity'],
        strengths: [],
        weaknesses: ['No examples', 'Unclear instructions'],
      };

      const mockImprovedPrompt = {
        text: '<task>Improved prompt with examples</task>',
        techniquesApplied: ['xml-structure', 'rich-examples'],
        changes: ['Added XML structure', 'Added examples'],
      };

      const mockImprovedEvaluation = {
        overallScore: 85,
        scores: {
          clarity: { score: 0.9, weight: 1.2, feedback: 'Much clearer' },
          examples: { score: 0.8, weight: 1.0, feedback: 'Good examples' },
        },
        recommendations: [],
        strengths: ['Clear', 'Good examples'],
        weaknesses: [],
      };

      vi.mocked(evaluatePrompt)
        .mockResolvedValueOnce(mockEvaluation)
        .mockResolvedValueOnce(mockImprovedEvaluation);
      
      vi.mocked(applyImprovements).mockResolvedValue(mockImprovedPrompt);

      const result = await handleImprove({
        prompt: 'Original prompt',
      });

      expect(evaluatePrompt).toHaveBeenCalledTimes(2);
      expect(evaluatePrompt).toHaveBeenNthCalledWith(1, 'Original prompt', undefined, false);
      expect(evaluatePrompt).toHaveBeenNthCalledWith(2, mockImprovedPrompt.text, undefined, false);
      
      expect(applyImprovements).toHaveBeenCalledWith(
        'Original prompt',
        mockEvaluation,
        expect.any(Array)
      );

      const data = JSON.parse(result.content[0].text);
      expect(data.improvedPrompt).toBe(mockImprovedPrompt.text);
      expect(data.originalScore).toBe(60);
      expect(data.improvedScore).toBe(85);
      expect(data.improvement).toBe(25);
      expect(data.techniquesApplied).toEqual(['xml-structure', 'rich-examples']);
    });

    it('should apply specific techniques when provided', async () => {
      const mockEvaluation = {
        overallScore: 70,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };

      const mockImprovedPrompt = {
        text: 'Improved with specific techniques',
        techniquesApplied: ['chain-of-thought', 'error-handling'],
        changes: [],
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      vi.mocked(applyImprovements).mockResolvedValue(mockImprovedPrompt);

      const result = await handleImprove({
        prompt: 'Original prompt',
        techniques: ['chain-of-thought', 'error-handling'],
      });

      expect(applyImprovements).toHaveBeenCalledWith(
        'Original prompt',
        mockEvaluation,
        ['chain-of-thought', 'error-handling']
      );

      const data = JSON.parse(result.content[0].text);
      expect(data.techniquesApplied).toEqual(['chain-of-thought', 'error-handling']);
    });
  });

  describe('Model-specific optimization', () => {
    it('should apply model-specific optimization when enabled', async () => {
      const mockEvaluation = {
        overallScore: 65,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };

      const mockImprovedPrompt = {
        text: 'Base improved prompt',
        techniquesApplied: ['xml-structure'],
        changes: [],
      };

      const mockOptimizedPrompt = {
        text: '<task>Claude-optimized prompt</task>',
        targetModel: 'claude',
        optimizations: ['XML tags', 'Thinking tags'],
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      vi.mocked(applyImprovements).mockResolvedValue(mockImprovedPrompt);
      vi.mocked(optimizePrompt).mockResolvedValue(mockOptimizedPrompt);

      const result = await handleImprove({
        prompt: 'Original prompt',
        targetModel: 'claude',
        enableModelOptimization: true,
      });

      expect(optimizePrompt).toHaveBeenCalledWith(
        mockImprovedPrompt.text,
        'claude',
        true
      );

      const data = JSON.parse(result.content[0].text);
      expect(data.improvedPrompt).toBe(mockOptimizedPrompt.text);
      expect(data.targetModel).toBe('claude');
      expect(data.modelOptimizations).toEqual(['XML tags', 'Thinking tags']);
    });

    it('should handle GPT model optimization', async () => {
      const mockEvaluation = {
        overallScore: 70,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };

      const mockImprovedPrompt = {
        text: 'Base improved prompt',
        techniquesApplied: [],
        changes: [],
      };

      const mockOptimizedPrompt = {
        text: 'System: GPT-optimized prompt\n\nUser: Request',
        targetModel: 'gpt',
        optimizations: ['System message', 'JSON mode'],
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      vi.mocked(applyImprovements).mockResolvedValue(mockImprovedPrompt);
      vi.mocked(optimizePrompt).mockResolvedValue(mockOptimizedPrompt);

      const result = await handleImprove({
        prompt: 'Original prompt',
        targetModel: 'gpt',
        enableModelOptimization: true,
      });

      expect(optimizePrompt).toHaveBeenCalledWith(
        mockImprovedPrompt.text,
        'gpt',
        true
      );

      const data = JSON.parse(result.content[0].text);
      expect(data.targetModel).toBe('gpt');
      expect(data.modelOptimizations).toContain('System message');
    });

    it('should handle Gemini model optimization', async () => {
      const mockEvaluation = {
        overallScore: 68,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };

      const mockImprovedPrompt = {
        text: 'Base improved prompt',
        techniquesApplied: [],
        changes: [],
      };

      const mockOptimizedPrompt = {
        text: 'Gemini-optimized prompt with safety settings',
        targetModel: 'gemini',
        optimizations: ['Safety settings', 'Examples'],
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      vi.mocked(applyImprovements).mockResolvedValue(mockImprovedPrompt);
      vi.mocked(optimizePrompt).mockResolvedValue(mockOptimizedPrompt);

      const result = await handleImprove({
        prompt: 'Original prompt',
        targetModel: 'gemini',
        enableModelOptimization: true,
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.targetModel).toBe('gemini');
      expect(data.modelOptimizations).toContain('Safety settings');
    });
  });

  describe('Iterative improvement', () => {
    it('should stop when target score is reached', async () => {
      const evaluations = [
        { overallScore: 60, scores: {}, recommendations: [], strengths: [], weaknesses: [] },
        { overallScore: 75, scores: {}, recommendations: [], strengths: [], weaknesses: [] },
        { overallScore: 88, scores: {}, recommendations: [], strengths: [], weaknesses: [] },
      ];

      let evalIndex = 0;
      vi.mocked(evaluatePrompt).mockImplementation(async () => evaluations[evalIndex++]);

      vi.mocked(applyImprovements)
        .mockResolvedValueOnce({
          text: 'Iteration 1',
          techniquesApplied: ['xml-structure'],
          changes: [],
        })
        .mockResolvedValueOnce({
          text: 'Iteration 2',
          techniquesApplied: ['examples'],
          changes: [],
        });

      const result = await handleImprove({
        prompt: 'Original prompt',
        maxIterations: 5,
      });

      // Should evaluate 3 times: original + 2 improvements
      expect(evaluatePrompt).toHaveBeenCalledTimes(3);
      expect(applyImprovements).toHaveBeenCalledTimes(2);

      const data = JSON.parse(result.content[0].text);
      expect(data.improvedScore).toBe(88);
      expect(data.iterations).toBe(2);
    });

    it('should respect maxIterations limit', async () => {
      const lowScoreEval = { 
        overallScore: 50, 
        scores: {}, 
        recommendations: ['Many improvements needed'], 
        strengths: [], 
        weaknesses: ['Multiple issues'] 
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(lowScoreEval);
      vi.mocked(applyImprovements).mockResolvedValue({
        text: 'Slightly improved',
        techniquesApplied: ['minimal'],
        changes: [],
      });

      const result = await handleImprove({
        prompt: 'Poor prompt',
        maxIterations: 2,
      });

      // Original evaluation + 2 iterations = 3 evaluations
      expect(evaluatePrompt).toHaveBeenCalledTimes(3);
      expect(applyImprovements).toHaveBeenCalledTimes(2);

      const data = JSON.parse(result.content[0].text);
      expect(data.iterations).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should handle evaluation errors gracefully', async () => {
      vi.mocked(evaluatePrompt).mockRejectedValue(new Error('Evaluation failed'));

      const result = await handleImprove({
        prompt: 'Test prompt',
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe('Evaluation failed');
      expect(data.improvedPrompt).toBe('Test prompt');
    });

    it('should handle improvement errors gracefully', async () => {
      const mockEvaluation = {
        overallScore: 60,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      vi.mocked(applyImprovements).mockRejectedValue(new Error('Improvement failed'));

      const result = await handleImprove({
        prompt: 'Test prompt',
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe('Improvement failed');
      expect(data.originalScore).toBe(60);
    });

    it('should handle model optimization errors', async () => {
      const mockEvaluation = {
        overallScore: 70,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };

      const mockImprovedPrompt = {
        text: 'Improved prompt',
        techniquesApplied: [],
        changes: [],
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      vi.mocked(applyImprovements).mockResolvedValue(mockImprovedPrompt);
      vi.mocked(optimizePrompt).mockRejectedValue(new Error('Optimization failed'));

      const result = await handleImprove({
        prompt: 'Test prompt',
        targetModel: 'claude',
        enableModelOptimization: true,
      });

      // Should still return the basic improvement
      const data = JSON.parse(result.content[0].text);
      expect(data.improvedPrompt).toBe('Improved prompt');
      expect(data.warning).toContain('Model optimization failed');
    });

    it('should handle empty prompt', async () => {
      const result = await handleImprove({
        prompt: '',
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBeDefined();
      expect(data.improvedPrompt).toBe('');
    });

    it('should handle invalid techniques', async () => {
      const mockEvaluation = {
        overallScore: 70,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };

      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      vi.mocked(applyImprovements).mockResolvedValue({
        text: 'Improved with valid techniques only',
        techniquesApplied: ['xml-structure'],
        changes: [],
      });

      const result = await handleImprove({
        prompt: 'Test prompt',
        techniques: ['invalid-technique', 'xml-structure'],
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.techniquesApplied).toContain('xml-structure');
      expect(data.warning).toContain('Some techniques were invalid');
    });
  });

  describe('LLM integration', () => {
    it('should return LLM task request when useLLM is true', async () => {
      const mockLLMRequest = {
        action: 'require_claude_task',
        task: {
          agent: 'claude4-opus-prompt-optimizer',
          prompt: 'Test prompt',
          instructions: 'Optimize this prompt',
        },
      };

      vi.mocked(evaluatePrompt).mockResolvedValue({ overallScore: 60, scores: {}, recommendations: [], strengths: [], weaknesses: [] });
      vi.mocked(applyImprovements).mockResolvedValue(mockLLMRequest as any);

      const result = await handleImprove({
        prompt: 'Test prompt',
        useLLM: true,
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.action).toBe('require_claude_task');
      expect(data.task.agent).toBe('claude4-opus-prompt-optimizer');
    });
  });
});