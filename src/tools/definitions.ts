/**
 * MCP Tool Definitions
 * Comprehensive tool schemas for the Langfuse prompt MCP server
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { MCPTool, MCPToolName } from '../types/mcp.js';

/**
 * Track tool definition
 * Records prompts to Langfuse with metadata and scoring
 */
const trackTool: MCPTool<'track'> = {
  name: 'track',
  description: 'Track a prompt to Langfuse for history and analysis',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { 
        type: 'string', 
        description: 'The prompt to track',
        minimum: 1
      },
      category: { 
        type: 'string', 
        description: 'Optional category'
      },
      metadata: { 
        type: 'object', 
        description: 'Optional metadata',
        properties: {
          wordCount: { type: 'number' },
          complexity: { type: 'string' },
          hasCode: { type: 'boolean' },
          frameworks: { 
            type: 'array',
            items: { type: 'string' }
          },
        }
      },
      quickScore: { 
        type: 'number', 
        description: 'Optional quick score 0-100',
        minimum: 0,
        maximum: 100
      },
    },
    required: ['prompt'],
  },
};

/**
 * Evaluate tool definition
 * Analyzes prompts on multiple criteria with recommendations
 */
const evaluateTool: MCPTool<'evaluate'> = {
  name: 'evaluate',
  description: 'Evaluate a prompt on 10 criteria and get improvement recommendations',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { 
        type: 'string', 
        description: 'The prompt to evaluate',
        minimum: 1
      },
      promptId: { 
        type: 'string', 
        description: 'Optional Langfuse prompt ID'
      },
    },
    required: ['prompt'],
  },
};

/**
 * Improve tool definition
 * Generates improved prompt versions with model-specific optimizations
 */
const improveTool: MCPTool<'improve'> = {
  name: 'improve',
  description: 'Generate an improved version of a prompt with model-specific optimizations',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { 
        type: 'string', 
        description: 'The prompt to improve',
        minimum: 1
      },
      promptId: { 
        type: 'string', 
        description: 'Optional Langfuse prompt ID'
      },
      techniques: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific techniques to apply',
      },
      targetModel: {
        type: 'string',
        description: 'Target model for optimization (claude, gpt, gemini)',
        enum: ['claude', 'gpt', 'gemini'] as const,
      },
      enableModelOptimization: {
        type: 'boolean',
        description: 'Enable model-specific optimizations',
        default: true,
      },
    },
    required: ['prompt'],
  },
};

/**
 * Compare tool definition
 * Compares two prompt versions with detailed analysis
 */
const compareTool: MCPTool<'compare'> = {
  name: 'compare',
  description: 'Compare two prompt versions',
  inputSchema: {
    type: 'object',
    properties: {
      prompt1: { 
        type: 'string', 
        description: 'First prompt version',
        minimum: 1
      },
      prompt2: { 
        type: 'string', 
        description: 'Second prompt version',
        minimum: 1
      },
      promptId: { 
        type: 'string', 
        description: 'Optional Langfuse prompt ID'
      },
    },
    required: ['prompt1', 'prompt2'],
  },
};

/**
 * Patterns tool definition
 * Extracts patterns from high-scoring prompts
 */
const patternsTool: MCPTool<'patterns'> = {
  name: 'patterns',
  description: 'Extract patterns from high-scoring prompts in Langfuse',
  inputSchema: {
    type: 'object',
    properties: {
      minScore: { 
        type: 'number', 
        description: 'Minimum score threshold', 
        default: 85,
        minimum: 0,
        maximum: 100
      },
      limit: { 
        type: 'number', 
        description: 'Number of prompts to analyze', 
        default: 100,
        minimum: 1,
        maximum: 1000
      },
    },
  },
};

/**
 * Deploy tool definition
 * Deploys prompt versions to production environments
 */
const deployTool: MCPTool<'deploy'> = {
  name: 'deploy',
  description: 'Deploy a prompt version to production',
  inputSchema: {
    type: 'object',
    properties: {
      promptId: { 
        type: 'string', 
        description: 'Prompt ID',
        minimum: 1
      },
      version: { 
        type: 'string', 
        description: 'Version to deploy',
        minimum: 1
      },
      label: { 
        type: 'string', 
        description: 'Deployment label', 
        default: 'production'
      },
    },
    required: ['promptId', 'version'],
  },
};

/**
 * Combined tool definitions array
 * Export as compatible MCP Tool array
 */
export const toolDefinitions: ReadonlyArray<any> = [
  trackTool,
  evaluateTool,
  improveTool,
  compareTool,
  patternsTool,
  deployTool,
];

/**
 * Tool name to definition mapping for type safety
 */
export const toolMap: Record<MCPToolName, MCPTool> = {
  track: trackTool,
  evaluate: evaluateTool,
  improve: improveTool,
  compare: compareTool,
  patterns: patternsTool,
  deploy: deployTool,
} as const;

/**
 * Type guard to check if a string is a valid tool name
 */
export function isValidToolName(name: string): name is MCPToolName {
  return name in toolMap;
}

/**
 * Get tool definition by name with type safety
 */
export function getToolDefinition<T extends MCPToolName>(
  name: T
): typeof toolMap[T] {
  if (!isValidToolName(name)) {
    throw new Error(`Invalid tool name: ${name}`);
  }
  return toolMap[name] as typeof toolMap[T];
}