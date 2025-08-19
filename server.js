#!/usr/bin/env node

/**
 * Langfuse Prompt MCP Server
 * 
 * A Model Context Protocol server for advanced prompt management,
 * evaluation, and optimization integrated with Langfuse.
 * 
 * @module langfuse-prompt-mcp
 * @version 1.0.0
 */

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
import { serverLogger } from './src/utils/logger.js';
import { PERFORMANCE } from './src/constants.js';

// Handler mapping for better maintainability
const TOOL_HANDLERS = {
  track: handleTrack,
  evaluate: handleEvaluate,
  improve: handleImprove,
  compare: handleCompare,
  patterns: handlePatterns,
  deploy: handleDeploy,
};

// Server configuration
const SERVER_CONFIG = {
  name: 'langfuse-prompt',
  version: '1.0.0',
};

// Initialize MCP server
const server = new Server(
  SERVER_CONFIG,
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

/**
 * Handle tool execution requests
 * Routes to appropriate handler based on tool name
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const timer = serverLogger.timer(`Tool: ${request.params.name}`);
  
  try {
    const { name, arguments: args } = request.params;
    
    // Validate tool exists
    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}. Available tools: ${Object.keys(TOOL_HANDLERS).join(', ')}`
      );
    }
    
    // Execute handler
    const result = await handler(args);
    
    // Log performance metrics
    timer.end();
    
    return result;
    
  } catch (error) {
    timer.end();
    
    if (error instanceof z.ZodError) {
      const details = error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join('; ');
      
      serverLogger.error(`Validation Error - Tool: ${request.params.name}, Details: ${details}`);
      
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${details}`
      );
    }
    
    if (error instanceof McpError) {
      serverLogger.error(`MCP Error - Code: ${error.code}, Message: ${error.message}`);
      throw error;
    }
    
    // Log unexpected errors
    serverLogger.error(`Unexpected Error - Tool: ${request.params.name}, Error:`, error.message);
    serverLogger.debug('Stack trace:', error.stack);
    
    // Re-throw with context
    throw new McpError(
      ErrorCode.InternalError,
      `Internal error in tool ${request.params.name}: ${error.message}`
    );
  }
});

/**
 * Initialize and start the MCP server
 * Sets up stdio transport and handles graceful shutdown
 */
async function main() {
  try {
    const transport = new StdioServerTransport();
    
    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      serverLogger.info('Shutting down gracefully...');
      try {
        await server.close();
        serverLogger.info('Shutdown complete');
      } catch (error) {
        serverLogger.error('Error during shutdown:', error.message);
      }
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      serverLogger.info('Received SIGTERM, shutting down...');
      try {
        await server.close();
      } catch (error) {
        serverLogger.error('Error during shutdown:', error.message);
      }
      process.exit(0);
    });
    
    // Connect server to transport
    await server.connect(transport);
    serverLogger.info(`Langfuse Prompt MCP server v${SERVER_CONFIG.version} running`);
    serverLogger.info(`Available tools: ${Object.keys(TOOL_HANDLERS).join(', ')}`);
    
  } catch (error) {
    serverLogger.fatal('Failed to start server:', error);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  serverLogger.fatal('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  serverLogger.fatal(`Unhandled rejection at: ${promise}, Reason: ${reason}`);
});

// Start server
main();