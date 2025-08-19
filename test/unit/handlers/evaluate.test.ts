/**
 * Unit Tests for Evaluate Handler
 * 
 * Tests the prompt evaluation handler functionality including:
 * - Rule-based evaluation
 * - LLM-based evaluation requests
 * - Error handling
 * - Score tracking to Langfuse
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleEvaluate } from '../../../src/handlers/evaluate.js';
import { evaluatePrompt } from '../../../src/evaluators/index.js';
import { Langfuse } from 'langfuse';

// Mock dependencies
vi.mock('../../../src/evaluators/index.js');
vi.mock('langfuse');
vi.mock('../../../src/utils/logger.js', () => ({
  serverLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('handleEvaluate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Langfuse instance
    const mockLangfuse = {
      trace: vi.fn().mockReturnValue({
        id: 'mock-trace-id',
        update: vi.fn(),
        score: vi.fn(),
      }),
      flush: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
    };
    
    vi.mocked(Langfuse).mockImplementation(() => mockLangfuse as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rule-based evaluation', () => {
    it('should evaluate prompt with rule-based scoring when LLM is disabled', async () => {
      const mockEvaluation = {
        overallScore: 75,
        scores: {
          clarity: { score: 0.8, weight: 1.2, feedback: 'Clear and concise' },
          structure: { score: 0.7, weight: 1.1, feedback: 'Well structured' },
          examples: { score: 0.6, weight: 1.0, feedback: 'Needs more examples' },
        },
        recommendations: ['Add more examples', 'Improve error handling'],
        strengths: ['Clear instructions', 'Good structure'],
        weaknesses: ['Lacks examples'],
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      
      const result = await handleEvaluate({ 
        prompt: 'Test prompt content',
        useLLM: false,
      });
      
      expect(evaluatePrompt).toHaveBeenCalledWith('Test prompt content', null, false);
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text);
      expect(data.overallScore).toBe(75);
      expect(data.scores).toEqual(mockEvaluation.scores);
      expect(data.recommendations).toContain('Add more examples');
    });

    it('should handle promptId and track scores to Langfuse', async () => {
      const mockEvaluation = {
        overallScore: 85,
        scores: {
          clarity: { score: 0.9, weight: 1.2, feedback: 'Excellent clarity' },
        },
        recommendations: [],
        strengths: ['Very clear'],
        weaknesses: [],
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      
      const result = await handleEvaluate({ 
        prompt: 'Test prompt',
        promptId: 'test-prompt-id',
        useLLM: false,
      });
      
      expect(evaluatePrompt).toHaveBeenCalledWith('Test prompt', 'test-prompt-id', false);
      
      const data = JSON.parse(result.content[0].text);
      expect(data.overallScore).toBe(85);
      expect(data.promptId).toBe('test-prompt-id');
    });

    it('should handle evaluation with all criteria', async () => {
      const mockEvaluation = {
        overallScore: 82,
        scores: {
          clarity: { score: 0.9, weight: 1.2, feedback: 'Excellent' },
          structure: { score: 0.85, weight: 1.1, feedback: 'Good' },
          examples: { score: 0.8, weight: 1.0, feedback: 'Sufficient' },
          chainOfThought: { score: 0.75, weight: 1.1, feedback: 'Present' },
          techSpecificity: { score: 0.9, weight: 1.2, feedback: 'Detailed' },
          errorHandling: { score: 0.7, weight: 1.0, feedback: 'Basic' },
          performance: { score: 0.8, weight: 0.9, feedback: 'Optimized' },
          testing: { score: 0.85, weight: 0.9, feedback: 'Comprehensive' },
          outputFormat: { score: 0.9, weight: 1.0, feedback: 'Well defined' },
          deployment: { score: 0.8, weight: 0.8, feedback: 'Ready' },
        },
        recommendations: ['Improve error handling'],
        strengths: ['Clear', 'Well structured', 'Good examples'],
        weaknesses: ['Error handling could be better'],
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      
      const result = await handleEvaluate({ 
        prompt: 'Comprehensive test prompt',
        useLLM: false,
      });
      
      const data = JSON.parse(result.content[0].text);
      expect(data.overallScore).toBe(82);
      expect(Object.keys(data.scores)).toHaveLength(10);
      expect(data.scores.clarity.score).toBe(0.9);
      expect(data.scores.deployment.score).toBe(0.8);
    });
  });

  describe('LLM evaluation', () => {
    it('should return LLM task request when useLLM is true', async () => {
      const mockLLMRequest = {
        action: 'require_claude_task',
        task: {
          agent: 'prompt-evaluation-judge',
          prompt: 'Test prompt',
          instructions: 'Evaluate this prompt',
        },
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockLLMRequest);
      
      const result = await handleEvaluate({ 
        prompt: 'Test prompt',
        useLLM: true,
      });
      
      expect(evaluatePrompt).toHaveBeenCalledWith('Test prompt', null, true);
      
      const data = JSON.parse(result.content[0].text);
      expect(data.action).toBe('require_claude_task');
      expect(data.task.agent).toBe('prompt-evaluation-judge');
    });

    it('should pass promptId to LLM evaluation', async () => {
      const mockLLMRequest = {
        action: 'require_claude_task',
        task: {
          agent: 'prompt-evaluation-judge',
          prompt: 'Test prompt',
          promptId: 'test-id',
        },
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockLLMRequest);
      
      const result = await handleEvaluate({ 
        prompt: 'Test prompt',
        promptId: 'test-id',
        useLLM: true,
      });
      
      expect(evaluatePrompt).toHaveBeenCalledWith('Test prompt', 'test-id', true);
      
      const data = JSON.parse(result.content[0].text);
      expect(data.task.promptId).toBe('test-id');
    });
  });

  describe('Error handling', () => {
    it('should handle evaluation errors gracefully', async () => {
      const mockError = new Error('Evaluation failed');
      vi.mocked(evaluatePrompt).mockRejectedValue(mockError);
      
      const result = await handleEvaluate({ 
        prompt: 'Test prompt',
        useLLM: false,
      });
      
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBe('Evaluation failed');
      expect(data.overallScore).toBe(0);
      expect(data.recommendations).toContain('Unable to evaluate prompt');
    });

    it('should handle missing prompt gracefully', async () => {
      const result = await handleEvaluate({ 
        prompt: '',
        useLLM: false,
      });
      
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBeDefined();
      expect(data.overallScore).toBe(0);
    });

    it('should handle invalid prompt type', async () => {
      const result = await handleEvaluate({ 
        prompt: null as any,
        useLLM: false,
      });
      
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toBeDefined();
      expect(data.overallScore).toBe(0);
    });

    it('should handle network errors when tracking to Langfuse', async () => {
      const mockEvaluation = {
        overallScore: 75,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      
      const mockLangfuse = {
        trace: vi.fn().mockImplementation(() => {
          throw new Error('Network error');
        }),
        flush: vi.fn(),
        shutdown: vi.fn(),
      };
      
      vi.mocked(Langfuse).mockImplementation(() => mockLangfuse as any);
      
      const result = await handleEvaluate({ 
        prompt: 'Test prompt',
        promptId: 'test-id',
        useLLM: false,
      });
      
      // Should still return evaluation result despite Langfuse error
      const data = JSON.parse(result.content[0].text);
      expect(data.overallScore).toBe(75);
    });
  });

  describe('Input validation', () => {
    it('should handle very long prompts', async () => {
      const longPrompt = 'a'.repeat(100000);
      const mockEvaluation = {
        overallScore: 60,
        scores: {},
        recommendations: ['Prompt is too long'],
        strengths: [],
        weaknesses: ['Excessive length'],
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      
      const result = await handleEvaluate({ 
        prompt: longPrompt,
        useLLM: false,
      });
      
      const data = JSON.parse(result.content[0].text);
      expect(data.overallScore).toBe(60);
      expect(data.weaknesses).toContain('Excessive length');
    });

    it('should handle prompts with special characters', async () => {
      const specialPrompt = 'Test <script>alert("xss")</script> prompt';
      const mockEvaluation = {
        overallScore: 70,
        scores: {},
        recommendations: [],
        strengths: [],
        weaknesses: [],
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      
      const result = await handleEvaluate({ 
        prompt: specialPrompt,
        useLLM: false,
      });
      
      expect(evaluatePrompt).toHaveBeenCalledWith(specialPrompt, null, false);
      
      const data = JSON.parse(result.content[0].text);
      expect(data.overallScore).toBe(70);
    });

    it('should handle Unicode and emoji in prompts', async () => {
      const unicodePrompt = 'Test 你好 🚀 prompt';
      const mockEvaluation = {
        overallScore: 80,
        scores: {},
        recommendations: [],
        strengths: ['International support'],
        weaknesses: [],
      };
      
      vi.mocked(evaluatePrompt).mockResolvedValue(mockEvaluation);
      
      const result = await handleEvaluate({ 
        prompt: unicodePrompt,
        useLLM: false,
      });
      
      const data = JSON.parse(result.content[0].text);
      expect(data.overallScore).toBe(80);
      expect(data.strengths).toContain('International support');
    });
  });
});