/**
 * Integration Tests for MCP Workflows
 * 
 * Tests complete MCP tool workflows including:
 * - Track -> Evaluate -> Improve -> Deploy pipeline
 * - Pattern extraction from high-scoring prompts
 * - Comparison workflows
 * - Error propagation across tools
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { handleTrack } from '../../src/handlers/track.js';
import { handleEvaluate } from '../../src/handlers/evaluate.js';
import { handleImprove } from '../../src/handlers/improve.js';
import { handleCompare } from '../../src/handlers/compare.js';
import { handlePatterns } from '../../src/handlers/patterns.js';
import { handleDeploy } from '../../src/handlers/deploy.js';
import { Langfuse } from 'langfuse';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Langfuse
vi.mock('langfuse');

// Mock file system for pattern saving
vi.mock('fs/promises');

describe('MCP Tool Workflows', () => {
  let mockLangfuseInstance: any;
  let mockTrace: any;

  beforeAll(() => {
    // Set up test environment
    process.env.LANGFUSE_PUBLIC_KEY = 'test-public-key';
    process.env.LANGFUSE_SECRET_KEY = 'test-secret-key';
    process.env.LANGFUSE_HOST = 'http://localhost:3000';
  });

  afterAll(() => {
    // Clean up environment
    delete process.env.LANGFUSE_PUBLIC_KEY;
    delete process.env.LANGFUSE_SECRET_KEY;
    delete process.env.LANGFUSE_HOST;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Langfuse trace
    mockTrace = {
      id: 'mock-trace-id',
      update: vi.fn().mockReturnThis(),
      score: vi.fn().mockReturnThis(),
      generation: vi.fn().mockReturnThis(),
    };
    
    // Mock Langfuse instance
    mockLangfuseInstance = {
      trace: vi.fn().mockReturnValue(mockTrace),
      flush: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
      getPrompt: vi.fn().mockResolvedValue({
        id: 'mock-prompt-id',
        name: 'test-prompt',
        prompt: 'Original prompt content',
        version: 1,
      }),
      createPrompt: vi.fn().mockResolvedValue({
        id: 'new-prompt-id',
        version: 2,
      }),
    };
    
    vi.mocked(Langfuse).mockImplementation(() => mockLangfuseInstance);
    
    // Mock file system
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('# Existing patterns\n\n## Pattern 1\nTest pattern');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Improvement Pipeline', () => {
    it('should execute track -> evaluate -> improve -> deploy workflow', async () => {
      const testPrompt = `Generate a function to validate email addresses.
        The function should return true for valid emails and false for invalid ones.`;
      
      // Step 1: Track the prompt
      const trackResult = await handleTrack({
        prompt: testPrompt,
        metadata: {
          category: 'validation',
          author: 'test-user',
        },
        quickScore: 60,
      });
      
      const trackData = JSON.parse(trackResult.content[0].text);
      expect(trackData.success).toBe(true);
      expect(trackData.traceId).toBe('mock-trace-id');
      expect(mockLangfuseInstance.trace).toHaveBeenCalledWith({
        name: 'prompt-track',
        metadata: expect.objectContaining({
          category: 'validation',
          author: 'test-user',
        }),
      });
      
      // Step 2: Evaluate the prompt
      const evalResult = await handleEvaluate({
        prompt: testPrompt,
        promptId: trackData.traceId,
        useLLM: false,
      });
      
      const evalData = JSON.parse(evalResult.content[0].text);
      expect(evalData.overallScore).toBeGreaterThan(0);
      expect(evalData.scores).toBeDefined();
      expect(evalData.recommendations).toBeInstanceOf(Array);
      
      // Step 3: Improve the prompt
      const improveResult = await handleImprove({
        prompt: testPrompt,
        promptId: trackData.traceId,
        techniques: ['xml-structure', 'examples', 'error-handling'],
        targetModel: 'claude',
        enableModelOptimization: true,
      });
      
      const improveData = JSON.parse(improveResult.content[0].text);
      expect(improveData.improvedPrompt).toBeDefined();
      expect(improveData.improvedScore).toBeGreaterThan(evalData.overallScore);
      expect(improveData.techniquesApplied).toContain('xml-structure');
      
      // Step 4: Deploy the improved prompt
      const deployResult = await handleDeploy({
        promptId: 'test-prompt',
        version: '2.0.0',
        label: 'production',
      });
      
      const deployData = JSON.parse(deployResult.content[0].text);
      expect(deployData.success).toBe(true);
      expect(deployData.deployedVersion).toBe('2.0.0');
      expect(deployData.label).toBe('production');
    });

    it('should handle failures gracefully in the pipeline', async () => {
      // Simulate Langfuse connection failure
      mockLangfuseInstance.trace.mockImplementation(() => {
        throw new Error('Langfuse connection failed');
      });
      
      const trackResult = await handleTrack({
        prompt: 'Test prompt',
        metadata: { category: 'test' },
      });
      
      const trackData = JSON.parse(trackResult.content[0].text);
      expect(trackData.success).toBe(false);
      expect(trackData.error).toContain('connection failed');
      
      // Should still be able to evaluate without tracking
      const evalResult = await handleEvaluate({
        prompt: 'Test prompt',
        useLLM: false,
      });
      
      const evalData = JSON.parse(evalResult.content[0].text);
      expect(evalData.overallScore).toBeGreaterThan(0);
    });
  });

  describe('Pattern Extraction Workflow', () => {
    it('should extract patterns from high-scoring prompts', async () => {
      // Mock high-scoring prompts in Langfuse
      mockLangfuseInstance.getPrompts = vi.fn().mockResolvedValue([
        {
          id: 'prompt-1',
          prompt: '<task>Clear task definition</task>',
          score: 90,
          metadata: { model: 'claude' },
        },
        {
          id: 'prompt-2',
          prompt: '<thinking>Step by step reasoning</thinking>',
          score: 88,
          metadata: { model: 'claude' },
        },
        {
          id: 'prompt-3',
          prompt: 'Low quality prompt',
          score: 40,
          metadata: { model: 'gpt' },
        },
      ]);
      
      const patternsResult = await handlePatterns({
        minScore: 85,
        limit: 10,
      });
      
      const patternsData = JSON.parse(patternsResult.content[0].text);
      expect(patternsData.patterns).toBeDefined();
      expect(patternsData.patterns.length).toBeGreaterThan(0);
      expect(patternsData.statistics.totalAnalyzed).toBe(2); // Only high-scoring prompts
      expect(patternsData.commonTechniques).toContain('xml-structure');
    });

    it('should save extracted patterns to file', async () => {
      mockLangfuseInstance.getPrompts = vi.fn().mockResolvedValue([
        {
          id: 'prompt-1',
          prompt: 'High quality prompt with examples',
          score: 92,
        },
      ]);
      
      const patternsResult = await handlePatterns({
        minScore: 90,
        limit: 5,
        saveToFile: true,
      });
      
      const patternsData = JSON.parse(patternsResult.content[0].text);
      expect(patternsData.savedTo).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalled();
      
      // Verify file content structure
      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;
      expect(content).toContain('# Prompt Patterns Analysis');
      expect(content).toContain('## Extracted Patterns');
    });
  });

  describe('Comparison Workflow', () => {
    it('should compare two prompt versions', async () => {
      const prompt1 = 'Simple prompt: Generate a function';
      const prompt2 = `<task>
        Generate a function with the following requirements:
        - Input validation
        - Error handling
        - Type hints
      </task>
      
      <examples>
        Input: valid_input
        Output: processed_result
      </examples>`;
      
      const compareResult = await handleCompare({
        prompt1,
        prompt2,
      });
      
      const compareData = JSON.parse(compareResult.content[0].text);
      expect(compareData.scores.prompt1).toBeLessThan(compareData.scores.prompt2);
      expect(compareData.winner).toBe('prompt2');
      expect(compareData.improvements).toContain('structure');
      expect(compareData.improvements).toContain('examples');
    });

    it('should track comparison results when promptId provided', async () => {
      const compareResult = await handleCompare({
        prompt1: 'Version 1',
        prompt2: 'Version 2 with improvements',
        promptId: 'comparison-trace',
      });
      
      const compareData = JSON.parse(compareResult.content[0].text);
      expect(compareData.promptId).toBe('comparison-trace');
      expect(mockTrace.update).toHaveBeenCalled();
      expect(mockTrace.score).toHaveBeenCalled();
    });
  });

  describe('Error Propagation', () => {
    it('should propagate errors through the workflow', async () => {
      // Create an invalid prompt that will fail evaluation
      const invalidPrompt = null as any;
      
      const evalResult = await handleEvaluate({
        prompt: invalidPrompt,
        useLLM: false,
      });
      
      const evalData = JSON.parse(evalResult.content[0].text);
      expect(evalData.error).toBeDefined();
      expect(evalData.overallScore).toBe(0);
      
      // Improvement should also handle the invalid prompt
      const improveResult = await handleImprove({
        prompt: invalidPrompt,
      });
      
      const improveData = JSON.parse(improveResult.content[0].text);
      expect(improveData.error).toBeDefined();
    });

    it('should handle network timeouts gracefully', async () => {
      // Simulate network timeout
      mockLangfuseInstance.flush.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );
      
      const trackResult = await handleTrack({
        prompt: 'Test prompt',
        metadata: { category: 'test' },
      });
      
      // Should complete despite flush timeout
      const trackData = JSON.parse(trackResult.content[0].text);
      expect(trackData).toBeDefined();
    });
  });

  describe('Model-Specific Workflows', () => {
    it('should optimize for Claude model', async () => {
      const prompt = 'Generate a Python function for data validation';
      
      const improveResult = await handleImprove({
        prompt,
        targetModel: 'claude',
        enableModelOptimization: true,
        techniques: ['xml-structure', 'chain-of-thought'],
      });
      
      const improveData = JSON.parse(improveResult.content[0].text);
      expect(improveData.targetModel).toBe('claude');
      expect(improveData.improvedPrompt).toContain('<');  // XML tags
      expect(improveData.modelOptimizations).toBeDefined();
    });

    it('should optimize for GPT model', async () => {
      const prompt = 'Generate a Python function for data validation';
      
      const improveResult = await handleImprove({
        prompt,
        targetModel: 'gpt',
        enableModelOptimization: true,
        techniques: ['examples', 'success-criteria'],
      });
      
      const improveData = JSON.parse(improveResult.content[0].text);
      expect(improveData.targetModel).toBe('gpt');
      expect(improveData.modelOptimizations).toBeDefined();
    });

    it('should optimize for Gemini model', async () => {
      const prompt = 'Generate a Python function for data validation';
      
      const improveResult = await handleImprove({
        prompt,
        targetModel: 'gemini',
        enableModelOptimization: true,
        techniques: ['examples'],
      });
      
      const improveData = JSON.parse(improveResult.content[0].text);
      expect(improveData.targetModel).toBe('gemini');
      expect(improveData.modelOptimizations).toBeDefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent evaluations', async () => {
      const prompts = [
        'Prompt 1: Simple task',
        'Prompt 2: Complex task with requirements',
        'Prompt 3: Technical implementation',
      ];
      
      const results = await Promise.all(
        prompts.map(prompt => 
          handleEvaluate({ prompt, useLLM: false })
        )
      );
      
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        const data = JSON.parse(result.content[0].text);
        expect(data.overallScore).toBeGreaterThan(0);
        expect(data.prompt).toBe(prompts[index]);
      });
    });

    it('should handle concurrent improvements', async () => {
      const improvements = await Promise.all([
        handleImprove({ prompt: 'Simple prompt 1' }),
        handleImprove({ prompt: 'Simple prompt 2' }),
      ]);
      
      expect(improvements).toHaveLength(2);
      improvements.forEach(result => {
        const data = JSON.parse(result.content[0].text);
        expect(data.improvedPrompt).toBeDefined();
        expect(data.improvedScore).toBeGreaterThan(0);
      });
    });
  });
});