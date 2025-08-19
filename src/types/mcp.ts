/**
 * MCP Protocol Type Definitions
 * Comprehensive types for Model Context Protocol server implementation
 */

import { z } from 'zod';

// ============= Core MCP Types =============

/**
 * MCP Tool parameter schema definition
 */
export interface MCPToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  enum?: readonly string[];
  items?: MCPToolParameter;
  properties?: Record<string, MCPToolParameter>;
  minimum?: number;
  maximum?: number;
  default?: unknown;
}

/**
 * MCP Tool definition with comprehensive typing
 */
export interface MCPTool<TName extends string = string, TInput = unknown> {
  name: TName;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameter>;
    required?: readonly string[];
  };
  handler?: MCPToolHandler<TInput>;
}

/**
 * MCP Tool handler function signature
 */
export type MCPToolHandler<TInput = unknown, TOutput = unknown> = (
  args: TInput,
  context?: MCPRequestContext
) => Promise<MCPToolResponse<TOutput>>;

/**
 * MCP Request context for handlers
 */
export interface MCPRequestContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * MCP Tool response types
 */
export type MCPToolResponse<T = unknown> = 
  | MCPSuccessResponse<T>
  | MCPErrorResponse
  | MCPDelegateResponse;

/**
 * Successful MCP response
 */
export interface MCPSuccessResponse<T = unknown> {
  success: true;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Error MCP response
 */
export interface MCPErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Delegate to Claude Task tool response
 */
export interface MCPDelegateResponse {
  action: 'require_claude_task';
  agentType: string;
  prompt: string;
  expectedFormat?: string;
}

/**
 * MCP Server configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP Prompt definition
 */
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

/**
 * MCP Prompt argument
 */
export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

// ============= Type Guards =============

/**
 * Type guard for MCP success response
 */
export function isMCPSuccessResponse<T>(
  response: MCPToolResponse<T>
): response is MCPSuccessResponse<T> {
  return 'success' in response && response.success === true;
}

/**
 * Type guard for MCP error response
 */
export function isMCPErrorResponse(
  response: MCPToolResponse
): response is MCPErrorResponse {
  return 'success' in response && response.success === false;
}

/**
 * Type guard for MCP delegate response
 */
export function isMCPDelegateResponse(
  response: MCPToolResponse
): response is MCPDelegateResponse {
  return 'action' in response && response.action === 'require_claude_task';
}

// ============= Tool Name Types =============

/**
 * Available MCP tool names
 */
export type MCPToolName = 
  | 'track'
  | 'evaluate'
  | 'improve'
  | 'compare'
  | 'patterns'
  | 'deploy';

// ============= Validation Schemas =============

/**
 * Zod schema for runtime validation of MCP requests
 */
export const MCPRequestSchema = z.object({
  tool: z.string(),
  arguments: z.record(z.unknown()),
  context: z.object({
    requestId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    metadata: z.record(z.unknown()).optional()
  }).optional()
});

export type MCPRequest = z.infer<typeof MCPRequestSchema>;

// ============= Error Classes =============

/**
 * Base MCP error class
 */
export class MCPError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
  }

  toResponse(): MCPErrorResponse {
    const response: MCPErrorResponse = {
      success: false,
      error: this.message
    };
    if (this.code !== undefined) {
      response.code = this.code;
    }
    if (this.details !== undefined) {
      response.details = this.details;
    }
    return response;
  }
}

/**
 * MCP validation error
 */
export class MCPValidationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'MCPValidationError';
  }
}

/**
 * MCP tool not found error
 */
export class MCPToolNotFoundError extends MCPError {
  constructor(toolName: string) {
    super(`Tool '${toolName}' not found`, 'TOOL_NOT_FOUND', { toolName });
    this.name = 'MCPToolNotFoundError';
  }
}

/**
 * MCP handler error
 */
export class MCPHandlerError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'HANDLER_ERROR', details);
    this.name = 'MCPHandlerError';
  }
}