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
  CallToolRequest,
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequest,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { toolDefinitions } from './src/tools/definitions.js';
import { handleEvaluate } from './src/handlers/evaluate.js';
import { handleImprove } from './src/handlers/improve.js';
import { handleCompare } from './src/handlers/compare.js';
import { handlePatterns } from './src/handlers/patterns.js';
import { handleDeploy } from './src/handlers/deploy.js';
import { handleTrack } from './src/handlers/track.js';
import { serverLogger } from './src/utils/logger.js';
import { PERFORMANCE } from './src/constants.js';

// Tool handler type definition - returns any for MCP compatibility
type ToolHandler = (args: unknown) => Promise<any>;

// Handler mapping with proper typing
const TOOL_HANDLERS: Record<string, ToolHandler> = {
  track: handleTrack,
  evaluate: handleEvaluate,
  improve: handleImprove,
  compare: handleCompare,
  patterns: handlePatterns,
  deploy: handleDeploy,
} as const;

// Server configuration
const SERVER_CONFIG = {
  name: 'langfuse-prompt',
  version: '1.0.0',
};

// Initialize MCP server with proper typing
const server = new Server(
  SERVER_CONFIG as any,
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register tool list handler
 * Returns available tool definitions
 */
server.setRequestHandler(
  ListToolsRequestSchema,
  async (_request: ListToolsRequest): Promise<{ tools: Tool[] }> => {
    return { tools: toolDefinitions as Tool[] };
  }
);

/**
 * Handle tool execution requests
 * Routes to appropriate handler based on tool name
 */
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest): Promise<any> => {
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
      
      // Execute handler with proper error handling
      const result = await handler(args);
      
      // Log performance metrics
      timer.end();
      
      return result;
      
    } catch (error: unknown) {
      timer.end();
      
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const details = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        
        serverLogger.error(
          `Validation Error - Tool: ${request.params.name}, Details: ${details}`
        );
        
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${details}`
        );
      }
      
      // Handle MCP errors
      if (error instanceof McpError) {
        serverLogger.error(
          `MCP Error - Code: ${error.code}, Message: ${error.message}`
        );
        throw error;
      }
      
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      serverLogger.error(
        `Unexpected Error - Tool: ${request.params.name}, Error: ${errorMessage}`
      );
      if (errorStack) {
        serverLogger.debug('Stack trace:', errorStack);
      }
      
      // Re-throw with context
      throw new McpError(
        ErrorCode.InternalError,
        `Internal error in tool ${request.params.name}: ${errorMessage}`
      );
    }
  }
);

/**
 * Handle graceful shutdown
 * @param signal - The signal received
 */
async function handleShutdown(signal: string): Promise<void> {
  serverLogger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await server.close();
    serverLogger.info('Shutdown complete');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    serverLogger.error('Error during shutdown:', errorMessage);
  }
  
  process.exit(0);
}

/**
 * Initialize and start the MCP server
 * Sets up stdio transport and handles graceful shutdown
 */
async function main(): Promise<void> {
  try {
    const transport = new StdioServerTransport();
    
    // Set up graceful shutdown handlers
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    
    // Connect server to transport
    await server.connect(transport);
    
    serverLogger.info(`Langfuse Prompt MCP server v${SERVER_CONFIG.version} running`);
    serverLogger.info(`Available tools: ${Object.keys(TOOL_HANDLERS).join(', ')}`);
    
    // Log performance configuration if enabled
    if (PERFORMANCE.MONITORING_ENABLED) {
      serverLogger.debug('Performance monitoring enabled');
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    serverLogger.fatal('Failed to start server:', errorMessage);
    process.exit(1);
  }
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  serverLogger.fatal('Uncaught exception:', error.message);
  serverLogger.debug('Stack trace:', error.stack);
  process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  const reasonString = reason instanceof Error ? reason.message : String(reason);
  serverLogger.fatal(`Unhandled rejection at: ${promise}, Reason: ${reasonString}`);
  process.exit(1);
});

// Start server
main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  serverLogger.fatal('Failed to start server:', errorMessage);
  process.exit(1);
});