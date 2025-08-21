/**
 * Vitest Test Setup
 * 
 * Global setup configuration for all test suites.
 * Configures mocks, environment variables, and test utilities.
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
config({ path: path.join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LANGFUSE_HOST = process.env.LANGFUSE_HOST || 'http://localhost:3000';

// Mock console methods to reduce noise in tests
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// Global test utilities
global.testUtils = {
  // Restore console for debugging
  restoreConsole: () => {
    Object.assign(console, originalConsole);
  },
  
  // Silence console for cleaner test output
  silenceConsole: () => {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  },
  
  // Create mock prompt data
  createMockPrompt: (overrides = {}) => ({
    text: 'Test prompt content',
    metadata: {
      category: 'test',
      model: 'test-model',
    },
    score: 50,
    ...overrides,
  }),
  
  // Create mock evaluation result
  createMockEvaluation: (overrides = {}) => ({
    overallScore: 75,
    scores: {
      clarity: { score: 0.8, weight: 1.2, feedback: 'Good clarity' },
      structure: { score: 0.7, weight: 1.1, feedback: 'Well structured' },
      examples: { score: 0.6, weight: 1.0, feedback: 'Needs more examples' },
    },
    recommendations: ['Add more examples', 'Improve error handling'],
    strengths: ['Clear instructions', 'Good structure'],
    weaknesses: ['Lacks examples', 'No error handling'],
    ...overrides,
  }),
  
  // Wait for async operations
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Global hooks for all tests
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset module cache for clean imports
  vi.resetModules();
  
  // Stub common environment variables
  vi.stubEnv('NODE_ENV', 'test');
  
  // Mock Date.now for consistent timestamps
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterEach(() => {
  // Restore real timers
  vi.useRealTimers();
  
  // Clear all timeouts/intervals
  vi.clearAllTimers();
  
  // Restore environment variables
  vi.unstubAllEnvs();
  
  // Restore global stubs
  vi.unstubAllGlobals();
});

// Export test utilities for use in test files
export { testUtils };

// Type declarations for global test utilities
declare global {
  var testUtils: {
    restoreConsole: () => void;
    silenceConsole: () => void;
    createMockPrompt: (overrides?: any) => any;
    createMockEvaluation: (overrides?: any) => any;
    waitForAsync: (ms?: number) => Promise<void>;
  };
}