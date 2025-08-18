#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { toolDefinitions } from './src/tools/definitions.js';
import { handleEvaluate } from './src/handlers/evaluate.js';
import { handleImprove } from './src/handlers/improve.js';
import { handleCompare } from './src/handlers/compare.js';
import { handlePatterns } from './src/handlers/patterns.js';
import { handleDeploy } from './src/handlers/deploy.js';
import { handleTrack } from './src/handlers/track.js';

// Server setup
const server = new Server(
  {
    name: 'langfuse-prompt',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: toolDefinitions };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Route to appropriate handler
    switch (name) {
      case 'track':
        return await handleTrack(args);
        
      case 'evaluate':
        return await handleEvaluate(args);
      
      case 'improve':
        return await handleImprove(args);
      
      case 'compare':
        return await handleCompare(args);
      
      case 'patterns':
        return await handlePatterns(args);
      
      case 'deploy':
        return await handleDeploy(args);
      
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`
      );
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Langfuse Prompt MCP server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});