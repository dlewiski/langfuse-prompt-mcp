/**
 * Unit Tests for Evaluation Criteria
 * 
 * Tests the individual criterion evaluators for prompt assessment.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateClarity,
  evaluateStructure,
  evaluateExamples,
  evaluateChainOfThought,
  evaluateTechSpecificity,
  evaluateErrorHandling,
  evaluatePerformance,
  evaluateTesting,
  evaluateOutputFormat,
  evaluateDeployment,
} from '../../../src/evaluators/criteria.js';

describe('Evaluation Criteria', () => {
  describe('evaluateClarity', () => {
    it('should score high for clear, concise prompts', () => {
      const prompt = `Generate a Python function that:
        1. Takes two numbers as input
        2. Returns their sum
        3. Includes type hints`;
      
      const result = evaluateClarity(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.7);
    });

    it('should score low for ambiguous prompts', () => {
      const prompt = 'Do the thing with the stuff and make it work somehow';
      
      const result = evaluateClarity(prompt);
      
      expect(result).toBeLessThanOrEqual(0.6); // Base 0.5 + no multiple questions 0.1
    });

    it('should recognize numbered steps as good structure', () => {
      const prompt = `1. First step
        2. Second step
        3. Third step`;
      
      const result = evaluateClarity(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('evaluateStructure', () => {
    it('should score high for XML-structured prompts', () => {
      const prompt = `<task>
        Generate a function
      </task>
      <requirements>
        - Type safe
        - Well documented
      </requirements>`;
      
      const result = evaluateStructure(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.6); // Base 0.3 + XML 0.3
    });

    it('should score high for markdown-structured prompts', () => {
      const prompt = `# Task
      Generate a function
      
      ## Requirements
      - Type safe
      - Well documented`;
      
      const result = evaluateStructure(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5); // Base 0.3 + Markdown 0.2
    });

    it('should score low for unstructured prompts', () => {
      const prompt = 'Just write some code that does something useful';
      
      const result = evaluateStructure(prompt);
      
      expect(result).toBeLessThan(0.4);
    });
  });

  describe('evaluateExamples', () => {
    it('should score high for prompts with examples', () => {
      const prompt = `Generate a function to validate email.
      
      Example:
      Input: user@example.com
      Output: true
      
      Input: invalid.email
      Output: false`;
      
      const result = evaluateExamples(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.4); // Base 0.2 + examples
    });

    it('should score high for prompts with code samples', () => {
      const prompt = `Create a sorting function.
      
      Sample usage:
      \`\`\`python
      result = sort_items([3, 1, 2])
      assert result == [1, 2, 3]
      \`\`\``;
      
      const result = evaluateExamples(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.2); // Base score for examples
    });

    it('should score low for prompts without examples', () => {
      const prompt = 'Create a function that sorts items';
      
      const result = evaluateExamples(prompt);
      
      expect(result).toBeLessThanOrEqual(0.4);
    });
  });

  describe('evaluateChainOfThought', () => {
    it('should score high for prompts with thinking sections', () => {
      const prompt = `<thinking>
        First, I need to understand the requirements
        Then, I'll design the solution
        Finally, I'll implement and test
      </thinking>
      
      Generate a solution`;
      
      const result = evaluateChainOfThought(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should score high for step-by-step reasoning', () => {
      const prompt = `Let's think step by step:
      1. Analyze the problem
      2. Design the approach
      3. Implement the solution`;
      
      const result = evaluateChainOfThought(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.7);
    });

    it('should score low for prompts without reasoning', () => {
      const prompt = 'Just do it';
      
      const result = evaluateChainOfThought(prompt);
      
      expect(result).toBeLessThanOrEqual(0.2); // Just base score
    });
  });

  describe('evaluateTechSpecificity', () => {
    it('should score high for technically specific prompts', () => {
      const prompt = `Implement a REST API endpoint using FastAPI that:
      - Accepts POST requests at /api/users
      - Validates input using Pydantic models
      - Returns JSON response with status 201
      - Implements rate limiting of 100 requests per minute`;
      
      const result = evaluateTechSpecificity(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should recognize technical terms', () => {
      const prompt = 'Use async/await with TypeScript generics and implement OAuth2 flow';
      
      const result = evaluateTechSpecificity(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.3); // Base + some tech terms
    });

    it('should score low for vague technical requirements', () => {
      const prompt = 'Make it fast and secure';
      
      const result = evaluateTechSpecificity(prompt);
      
      expect(result).toBeLessThanOrEqual(0.3); // Just base score
    });
  });

  describe('evaluateErrorHandling', () => {
    it('should score high for prompts with error handling', () => {
      const prompt = `Create a function that:
      - Handles invalid input gracefully
      - Throws TypeError for wrong types
      - Returns error messages for edge cases
      - Implements try-catch blocks`;
      
      const result = evaluateErrorHandling(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should recognize edge case handling', () => {
      const prompt = 'Handle edge cases like null, undefined, empty arrays, and negative numbers';
      
      const result = evaluateErrorHandling(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.7);
    });

    it('should score low for prompts without error handling', () => {
      const prompt = 'Create a simple function';
      
      const result = evaluateErrorHandling(prompt);
      
      expect(result).toBeLessThanOrEqual(0.2); // Just base score
    });
  });

  describe('evaluatePerformance', () => {
    it('should score high for performance-conscious prompts', () => {
      const prompt = `Implement with O(n log n) time complexity.
      Optimize for memory usage.
      Use memoization for repeated calculations.`;
      
      const result = evaluatePerformance(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should recognize optimization requirements', () => {
      const prompt = 'Ensure the solution is optimized and runs efficiently with large datasets';
      
      const result = evaluatePerformance(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.6);
    });

    it('should score low when performance is not mentioned', () => {
      const prompt = 'Create a function';
      
      const result = evaluatePerformance(prompt);
      
      expect(result).toBeLessThanOrEqual(0.5); // Just base score (0.5 for performance)
    });
  });

  describe('evaluateTesting', () => {
    it('should score high for prompts with testing requirements', () => {
      const prompt = `Create a function with:
      - Unit tests
      - Test coverage > 80%
      - Edge case testing
      - Integration tests`;
      
      const result = evaluateTesting(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should recognize testing frameworks', () => {
      const prompt = 'Include Jest tests with mocks and assertions';
      
      const result = evaluateTesting(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.7);
    });

    it('should score low without testing mentions', () => {
      const prompt = 'Create a function';
      
      const result = evaluateTesting(prompt);
      
      expect(result).toBeLessThanOrEqual(0.3);
    });
  });

  describe('evaluateOutputFormat', () => {
    it('should score high for well-defined output formats', () => {
      const prompt = `Return a JSON object with:
      {
        "status": "success",
        "data": [...],
        "timestamp": "ISO 8601 format"
      }`;
      
      const result = evaluateOutputFormat(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should recognize schema definitions', () => {
      const prompt = 'Output should match the UserSchema with id, name, and email fields';
      
      const result = evaluateOutputFormat(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.6);
    });

    it('should score low for undefined outputs', () => {
      const prompt = 'Return something useful';
      
      const result = evaluateOutputFormat(prompt);
      
      expect(result).toBeLessThanOrEqual(0.7); // Base + some format indicators
    });
  });

  describe('evaluateDeployment', () => {
    it('should score high for production-ready prompts', () => {
      const prompt = `Create a production-ready service with:
      - Docker configuration
      - Environment variables
      - CI/CD pipeline
      - Monitoring and logging`;
      
      const result = evaluateDeployment(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.5);
    });

    it('should recognize deployment requirements', () => {
      const prompt = 'Include deployment scripts and configuration for AWS';
      
      const result = evaluateDeployment(prompt);
      
      expect(result).toBeGreaterThanOrEqual(0.6);
    });

    it('should score low without deployment considerations', () => {
      const prompt = 'Create a function';
      
      const result = evaluateDeployment(prompt);
      
      expect(result).toBeLessThanOrEqual(0.5); // Just base score (0.5)
    });
  });
});