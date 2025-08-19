/**
 * End-to-End Tests for Prompt Improvement Pipeline
 * 
 * Tests complete user workflows from initial prompt to production deployment.
 * Uses real file system and simulates actual MCP server interactions.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { evaluatePrompt } from '../../src/evaluators/index.js';
import { applyImprovements } from '../../src/improvers/index.js';
import { saveImprovedPrompt } from '../../src/utils/promptSaver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sleep = promisify(setTimeout);

describe('E2E: Prompt Improvement Pipeline', () => {
  const testDir = path.join(__dirname, '.test-outputs');
  const promptsDir = path.join(testDir, 'prompts');
  let serverProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(promptsDir, { recursive: true });
    
    // Create test environment file
    const envContent = `
LANGFUSE_PUBLIC_KEY=test-public-key
LANGFUSE_SECRET_KEY=test-secret-key
LANGFUSE_HOST=http://localhost:3000
NODE_ENV=test
`;
    await fs.writeFile(path.join(testDir, '.env'), envContent);
  });

  afterAll(async () => {
    // Clean up test directories
    await fs.rm(testDir, { recursive: true, force: true });
    
    // Ensure server is stopped
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  beforeEach(() => {
    // Reset test state
  });

  afterEach(async () => {
    // Clean up test files
    const files = await fs.readdir(promptsDir);
    for (const file of files) {
      if (file.startsWith('test-')) {
        await fs.unlink(path.join(promptsDir, file));
      }
    }
  });

  describe('Complete Improvement Workflow', () => {
    it('should improve a basic prompt to production quality', async () => {
      const originalPrompt = `Create a function that validates email addresses`;
      
      // Step 1: Initial evaluation
      const initialEval = await evaluatePrompt(originalPrompt, null, false);
      
      expect(initialEval.overallScore).toBeLessThan(50);
      expect(initialEval.recommendations).toContain('Add examples');
      expect(initialEval.weaknesses.length).toBeGreaterThan(2);
      
      // Step 2: Apply first round of improvements
      const firstImproved = await applyImprovements(
        originalPrompt,
        initialEval,
        ['xml-structure', 'rich-examples', 'error-handling']
      );
      
      expect(firstImproved.text).toContain('<task>');
      expect(firstImproved.text).toContain('Example');
      expect(firstImproved.techniquesApplied).toHaveLength(3);
      
      // Step 3: Evaluate improved version
      const improvedEval = await evaluatePrompt(firstImproved.text, null, false);
      
      expect(improvedEval.overallScore).toBeGreaterThan(70);
      expect(improvedEval.overallScore).toBeGreaterThan(initialEval.overallScore + 20);
      
      // Step 4: Apply model-specific optimization
      const claudeOptimized = await applyImprovements(
        firstImproved.text,
        improvedEval,
        ['chain-of-thought', 'success-criteria']
      );
      
      expect(claudeOptimized.text).toContain('<thinking>');
      expect(claudeOptimized.text).toContain('Success criteria');
      
      // Step 5: Final evaluation
      const finalEval = await evaluatePrompt(claudeOptimized.text, null, false);
      
      expect(finalEval.overallScore).toBeGreaterThan(85);
      expect(finalEval.strengths.length).toBeGreaterThan(5);
      expect(finalEval.weaknesses.length).toBeLessThan(2);
      
      // Step 6: Save to file
      const saveResult = await saveImprovedPrompt({
        original: {
          text: originalPrompt,
          score: initialEval.overallScore,
        },
        improved: {
          text: claudeOptimized.text,
          score: finalEval.overallScore,
          techniquesApplied: [...firstImproved.techniquesApplied, ...claudeOptimized.techniquesApplied],
        },
        targetModel: 'claude',
        evaluation: initialEval,
        improvedEvaluation: finalEval,
        filename: path.join(promptsDir, 'test-email-validation.md'),
      });
      
      expect(saveResult.success).toBe(true);
      
      // Verify saved file
      const savedContent = await fs.readFile(saveResult.filepath, 'utf8');
      expect(savedContent).toContain('# Improved Prompt');
      expect(savedContent).toContain('## Score Comparison');
      expect(savedContent).toContain(`Original: ${initialEval.overallScore}`);
      expect(savedContent).toContain(`Improved: ${finalEval.overallScore}`);
      expect(savedContent).toContain('## Techniques Applied');
      expect(savedContent).toContain('xml-structure');
    });

    it('should handle complex technical prompts', async () => {
      const complexPrompt = `Build a REST API with authentication, rate limiting, 
        and database integration for a user management system`;
      
      // Initial evaluation
      const initialEval = await evaluatePrompt(complexPrompt, null, false);
      
      // Apply comprehensive improvements
      const improved = await applyImprovements(
        complexPrompt,
        initialEval,
        ['xml-structure', 'tech-specificity', 'error-handling', 'performance', 'testing']
      );
      
      // Verify improvements
      expect(improved.text).toContain('authentication');
      expect(improved.text).toContain('rate limiting');
      expect(improved.text).toContain('database');
      expect(improved.text.length).toBeGreaterThan(complexPrompt.length * 2);
      
      // Final evaluation
      const finalEval = await evaluatePrompt(improved.text, null, false);
      
      expect(finalEval.overallScore).toBeGreaterThan(75);
      expect(finalEval.scores.techSpecificity.score).toBeGreaterThan(0.7);
      expect(finalEval.scores.errorHandling.score).toBeGreaterThan(0.6);
    });
  });

  describe('Iterative Improvement', () => {
    it('should progressively improve a prompt over multiple iterations', async () => {
      let currentPrompt = 'Write code to sort an array';
      const scores: number[] = [];
      const maxIterations = 3;
      
      for (let i = 0; i < maxIterations; i++) {
        // Evaluate current version
        const evaluation = await evaluatePrompt(currentPrompt, null, false);
        scores.push(evaluation.overallScore);
        
        // Stop if score is good enough
        if (evaluation.overallScore >= 85) {
          break;
        }
        
        // Apply improvements based on weaknesses
        const techniques = [];
        if (evaluation.scores.examples?.score < 0.5) techniques.push('rich-examples');
        if (evaluation.scores.structure?.score < 0.5) techniques.push('xml-structure');
        if (evaluation.scores.chainOfThought?.score < 0.5) techniques.push('chain-of-thought');
        if (evaluation.scores.errorHandling?.score < 0.5) techniques.push('error-handling');
        if (techniques.length === 0) techniques.push('success-criteria');
        
        const improved = await applyImprovements(currentPrompt, evaluation, techniques);
        currentPrompt = improved.text;
      }
      
      // Verify progressive improvement
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1]);
      }
      
      // Final score should be significantly better
      expect(scores[scores.length - 1]).toBeGreaterThan(scores[0] + 15);
    });
  });

  describe('Model-Specific Pipelines', () => {
    it('should create Claude-optimized prompts', async () => {
      const basePrompt = 'Generate a React component for a user profile card';
      
      // Evaluate base prompt
      const baseEval = await evaluatePrompt(basePrompt, null, false);
      
      // Apply Claude-specific improvements
      const claudeImproved = await applyImprovements(
        basePrompt,
        baseEval,
        ['xml-structure', 'chain-of-thought', 'rich-examples']
      );
      
      // Verify Claude-specific features
      expect(claudeImproved.text).toMatch(/<task>[\s\S]*<\/task>/);
      expect(claudeImproved.text).toMatch(/<thinking>[\s\S]*<\/thinking>/);
      expect(claudeImproved.text).toContain('Example');
      
      // Save Claude version
      const saveResult = await saveImprovedPrompt({
        original: { text: basePrompt, score: baseEval.overallScore },
        improved: { 
          text: claudeImproved.text, 
          score: 0,  // Will be evaluated
          techniquesApplied: claudeImproved.techniquesApplied 
        },
        targetModel: 'claude',
        evaluation: baseEval,
        filename: path.join(promptsDir, 'test-claude-component.md'),
      });
      
      expect(saveResult.success).toBe(true);
    });

    it('should create GPT-optimized prompts', async () => {
      const basePrompt = 'Generate a React component for a user profile card';
      
      // Evaluate base prompt
      const baseEval = await evaluatePrompt(basePrompt, null, false);
      
      // Apply GPT-specific improvements
      const gptImproved = await applyImprovements(
        basePrompt,
        baseEval,
        ['system-message', 'json-format', 'rich-examples']
      );
      
      // Verify GPT-specific features
      expect(gptImproved.text).toContain('System:');
      expect(gptImproved.text).toContain('User:');
      expect(gptImproved.text).toContain('response_format');
      
      // Save GPT version
      const saveResult = await saveImprovedPrompt({
        original: { text: basePrompt, score: baseEval.overallScore },
        improved: { 
          text: gptImproved.text, 
          score: 0,
          techniquesApplied: gptImproved.techniquesApplied 
        },
        targetModel: 'gpt',
        evaluation: baseEval,
        filename: path.join(promptsDir, 'test-gpt-component.md'),
      });
      
      expect(saveResult.success).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should handle and recover from evaluation errors', async () => {
      const problematicPrompt = ''; // Empty prompt
      
      // Should handle empty prompt gracefully
      const evaluation = await evaluatePrompt(problematicPrompt, null, false);
      
      expect(evaluation.overallScore).toBe(0);
      expect(evaluation.recommendations).toContain('Provide a clear prompt');
      
      // Should still attempt improvement
      const improved = await applyImprovements(
        problematicPrompt || 'Generate code',
        evaluation,
        ['xml-structure', 'examples']
      );
      
      expect(improved.text).toBeTruthy();
      expect(improved.text.length).toBeGreaterThan(0);
    });

    it('should handle file system errors gracefully', async () => {
      const prompt = 'Test prompt';
      const evaluation = await evaluatePrompt(prompt, null, false);
      
      // Try to save to invalid path
      const invalidPath = '/invalid/path/that/does/not/exist/prompt.md';
      
      const saveResult = await saveImprovedPrompt({
        original: { text: prompt, score: 50 },
        improved: { text: 'Improved prompt', score: 75, techniquesApplied: [] },
        targetModel: 'claude',
        evaluation,
        filename: invalidPath,
      });
      
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete basic improvement in reasonable time', async () => {
      const startTime = Date.now();
      
      const prompt = 'Create a function to calculate fibonacci numbers';
      const evaluation = await evaluatePrompt(prompt, null, false);
      const improved = await applyImprovements(
        prompt,
        evaluation,
        ['xml-structure', 'examples']
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 2 seconds for basic improvement
      expect(duration).toBeLessThan(2000);
      expect(improved.text).toBeTruthy();
    });

    it('should handle batch improvements efficiently', async () => {
      const prompts = [
        'Create a login function',
        'Build a data validation utility',
        'Implement a caching mechanism',
        'Design an error handler',
        'Create a logging system',
      ];
      
      const startTime = Date.now();
      
      const improvements = await Promise.all(
        prompts.map(async (prompt) => {
          const evaluation = await evaluatePrompt(prompt, null, false);
          return applyImprovements(prompt, evaluation, ['xml-structure']);
        })
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 5 prompts within 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(improvements).toHaveLength(5);
      improvements.forEach(improved => {
        expect(improved.text).toContain('<task>');
      });
    });
  });

  describe('Quality Validation', () => {
    it('should maintain quality standards across improvements', async () => {
      const testPrompts = [
        'Create a user authentication system',
        'Build a REST API endpoint',
        'Implement a search algorithm',
      ];
      
      for (const prompt of testPrompts) {
        const evaluation = await evaluatePrompt(prompt, null, false);
        const improved = await applyImprovements(
          prompt,
          evaluation,
          ['xml-structure', 'rich-examples', 'error-handling', 'testing']
        );
        
        const finalEval = await evaluatePrompt(improved.text, null, false);
        
        // All improved prompts should meet quality standards
        expect(finalEval.overallScore).toBeGreaterThan(70);
        expect(finalEval.scores.clarity?.score).toBeGreaterThan(0.6);
        expect(finalEval.scores.structure?.score).toBeGreaterThan(0.7);
        expect(finalEval.scores.examples?.score).toBeGreaterThan(0.5);
      }
    });

    it('should preserve technical accuracy during improvement', async () => {
      const technicalPrompt = `Implement a binary search tree with O(log n) operations`;
      
      const evaluation = await evaluatePrompt(technicalPrompt, null, false);
      const improved = await applyImprovements(
        technicalPrompt,
        evaluation,
        ['xml-structure', 'tech-specificity', 'performance']
      );
      
      // Verify technical terms are preserved
      expect(improved.text).toContain('binary search tree');
      expect(improved.text).toContain('O(log n)');
      
      // Should add more technical details
      expect(improved.text).toMatch(/insert|delete|search|traverse/i);
      expect(improved.text.length).toBeGreaterThan(technicalPrompt.length);
    });
  });
});