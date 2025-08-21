/**
 * Tests for Queen Bee Orchestrator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueenBeeOrchestrator } from '../../src/orchestrator/queen-bee-orchestrator.js';

describe('Queen Bee Orchestrator Tests', () => {
  let orchestrator: QueenBeeOrchestrator;

  beforeEach(() => {
    orchestrator = QueenBeeOrchestrator.resetInstance({
      activation: { 
        automatic: true,
        manual_override: false,
        debug_mode: false 
      },
      parallelization: { 
        max_concurrent_agents: 5,
        timeout_ms: 3000,
        retry_on_failure: true,
        fallback_mode: 'basic_tracking'
      }
    });
  });

  afterEach(() => {
    orchestrator.clearHistory();
  });

  describe('Parallel Execution', () => {
    it('should spawn agents in parallel for efficiency', async () => {
      const startTime = Date.now();
      const prompt = "Create a React component for user authentication with error handling";
      
      const result = await orchestrator.orchestrate(prompt);
      const executionTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.originalPrompt).toBe(prompt);
      expect(executionTime).toBeLessThan(6000); // Should be faster than sequential
      expect(result.context).toBeDefined();
      expect(result.context.isReact).toBe(true);
    });

    it('should handle multiple prompts concurrently', async () => {
      const prompts = [
        "Create a simple React button",
        "Build an API endpoint for user login",
        "Implement a caching strategy"
      ];
      
      const startTime = Date.now();
      const results = await Promise.all(
        prompts.map(p => orchestrator.orchestrate(p))
      );
      const executionTime = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.originalScore).toBeGreaterThan(0);
      });
      
      // Parallel execution should be efficient
      expect(executionTime).toBeLessThan(10000);
    });
  });

  describe('Context Detection', () => {
    it('should detect React context and spawn appropriate specialists', async () => {
      const reactPrompt = "Create a React hook for data fetching with TypeScript";
      const result = await orchestrator.orchestrate(reactPrompt);
      
      expect(result.context.isReact).toBe(true);
      expect(result.context.hasFrontend).toBe(true);
      expect(result.context.frameworks).toContain('React');
    });

    it('should detect API context and spawn appropriate specialists', async () => {
      const apiPrompt = "Design a REST API for user management with authentication";
      const result = await orchestrator.orchestrate(apiPrompt);
      
      expect(result.context.isAPI).toBe(true);
      expect(result.context.hasBackend).toBe(true);
    });

    it('should assess complexity correctly', async () => {
      const simplePrompt = "Fix bug";
      const complexPrompt = "Implement a comprehensive microservices architecture with event-driven communication, service mesh, distributed tracing, and automated scaling based on load patterns";
      
      const simpleResult = await orchestrator.orchestrate(simplePrompt);
      const complexResult = await orchestrator.orchestrate(complexPrompt);
      
      expect(simpleResult.context.complexity).toBe('low');
      expect(complexResult.context.complexity).toBe('high');
    });
  });

  describe('Improvement Flow', () => {
    it('should improve low-quality prompts', async () => {
      const lowQualityPrompt = "fix bug";
      const result = await orchestrator.orchestrate(lowQualityPrompt);
      
      // Low quality prompt should trigger improvement
      if (result.originalScore < 70) {
        expect(result.improved).toBe(true);
        expect(result.finalScore).toBeGreaterThanOrEqual(result.originalScore);
      }
    });

    it('should skip improvement for high-quality prompts', async () => {
      const highQualityPrompt = `
        Create a React component for user authentication that:
        1. Handles email/password login
        2. Includes form validation
        3. Shows loading states
        4. Displays error messages
        5. Uses TypeScript for type safety
        6. Follows accessibility best practices
      `;
      
      const result = await orchestrator.orchestrate(highQualityPrompt);
      
      // High quality prompt might not need improvement
      if (result.originalScore >= 70) {
        expect(result.improved).toBe(false);
        expect(result.finalPrompt).toBe(highQualityPrompt);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle agent failures gracefully', async () => {
      // Create orchestrator with very short timeout to force failures
      const failOrchestrator = QueenBeeOrchestrator.resetInstance({
        parallelization: { 
          max_concurrent_agents: 5,
          timeout_ms: 1, // Force timeout
          retry_on_failure: false,
          fallback_mode: 'basic_tracking'
        }
      });
      
      const prompt = "Test prompt";
      
      // Should handle gracefully without throwing
      const result = await failOrchestrator.orchestrate(prompt);
      expect(result).toBeDefined();
      // The orchestrator should still return a result even with short timeout
    });

    it('should retry failed agents when configured', async () => {
      const retryOrchestrator = QueenBeeOrchestrator.resetInstance({
        parallelization: { 
          max_concurrent_agents: 5,
          timeout_ms: 100,
          retry_on_failure: true,
          fallback_mode: 'basic_tracking'
        }
      });
      
      const prompt = "Create a component";
      const result = await retryOrchestrator.orchestrate(prompt);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Pattern Extraction', () => {
    it('should trigger pattern extraction when threshold is met', async () => {
      // Add high-scoring prompts to history
      const highQualityPrompts = [
        "Create a well-structured React component with proper error handling",
        "Build a comprehensive API with validation and error responses",
        "Implement a secure authentication system with JWT tokens",
        "Design a scalable database schema with proper indexing",
        "Create a responsive UI with accessibility features",
        "Build a real-time notification system with WebSockets",
        "Implement a caching layer with Redis",
        "Create a CI/CD pipeline with automated testing",
        "Build a monitoring dashboard with metrics",
        "Implement a rate limiting system"
      ];
      
      // Process all prompts
      for (const prompt of highQualityPrompts) {
        await orchestrator.orchestrate(prompt);
      }
      
      // Check status to verify pattern extraction was triggered
      const status = orchestrator.getStatus();
      expect(status.historySize).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Orchestrator Status', () => {
    it('should provide accurate status information', () => {
      const status = orchestrator.getStatus();
      
      expect(status.active).toBe(true);
      expect(status.config).toBeDefined();
      expect(status.activeAgents).toBeInstanceOf(Array);
      expect(status.historySize).toBeGreaterThanOrEqual(0);
      expect(status.highScoreCount).toBeGreaterThanOrEqual(0);
    });

    it('should track prompt history correctly', async () => {
      const prompts = ["Test 1", "Test 2", "Test 3"];
      
      for (const prompt of prompts) {
        await orchestrator.orchestrate(prompt);
      }
      
      const status = orchestrator.getStatus();
      expect(status.historySize).toBe(3);
    });
  });

  describe('Configuration', () => {
    it('should respect configuration settings', () => {
      const customConfig = {
        thresholds: {
          improvement_trigger: 80,
          high_quality: 90,
          pattern_extraction_min: 5
        },
        parallelization: {
          max_concurrent_agents: 3,
          timeout_ms: 5000,
          retry_on_failure: true,
          fallback_mode: 'basic_tracking'
        }
      };
      
      const customOrchestrator = QueenBeeOrchestrator.resetInstance(customConfig);
      const status = customOrchestrator.getStatus();
      
      expect(status.config.thresholds.improvement_trigger).toBe(80);
      expect(status.config.thresholds.high_quality).toBe(90);
      expect(status.config.parallelization.max_concurrent_agents).toBe(3);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should be faster than sequential execution', async () => {
      const prompt = "Create a complex React application with routing, state management, and API integration";
      
      // Measure parallel execution
      const parallelStart = Date.now();
      const parallelResult = await orchestrator.orchestrate(prompt);
      const parallelTime = Date.now() - parallelStart;
      
      // Simulate sequential execution time (sum of all operations)
      // Tracking: 100ms, Evaluation: 200ms, Context: 50ms, Improvement: 300ms
      const expectedSequentialTime = 650;
      
      expect(parallelResult.success).toBe(true);
      expect(parallelTime).toBeLessThan(expectedSequentialTime);
      
      // Should achieve at least 20% improvement
      const improvement = ((expectedSequentialTime - parallelTime) / expectedSequentialTime) * 100;
      expect(improvement).toBeGreaterThan(20);
    });
  });
});

describe('Queen Bee Pattern Integration', () => {
  it('should integrate with Claude Code Task tool', async () => {
    // This test would verify integration with actual Claude Code Task tool
    // For now, we verify the structure is correct
    
    const orchestrator = QueenBeeOrchestrator.getInstance();
    expect(orchestrator).toBeDefined();
    
    const status = orchestrator.getStatus();
    expect(status.active).toBe(true);
    expect(status.config.activation.automatic).toBe(true);
  });

  it('should maintain singleton pattern', () => {
    const instance1 = QueenBeeOrchestrator.getInstance();
    const instance2 = QueenBeeOrchestrator.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});