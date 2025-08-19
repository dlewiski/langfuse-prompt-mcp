/**
 * Response utility for consistent MCP response formatting
 * 
 * Provides standardized response builders for success, error,
 * and special cases like LLM task delegation.
 */

import type { 
  MCPSuccessResponse, 
  MCPErrorResponse,
  MCPDelegateResponse 
} from '../types/mcp.js';

/**
 * MCP content structure
 */
interface MCPContent {
  type: 'text' | 'image';
  text?: string;
  data?: unknown;
}

/**
 * MCP response with content
 */
interface MCPResponseWithContent {
  content: MCPContent[];
}

/**
 * Response types enum
 */
export enum ResponseType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  LLM_EVALUATION = 'llm_evaluation'
}

/**
 * LLM action types
 */
export enum LLMAction {
  REQUIRE_CLAUDE_TASK = 'require_claude_task'
}

/**
 * Create a standard JSON response
 */
export function createResponse<T = unknown>(
  data: T,
  type: ResponseType = ResponseType.SUCCESS
): MCPResponseWithContent {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        type,
        ...data
      }, null, 2)
    }]
  };
}

/**
 * Create a success response
 */
export function successResponse<T = unknown>(data: T): MCPResponseWithContent {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(data, null, 2)
    }]
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  details: Record<string, unknown> = {}
): MCPResponseWithContent {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: message,
        ...details
      }, null, 2)
    }]
  };
}

/**
 * LLM task configuration
 */
export interface LLMTask {
  agentType: string;
  prompt: string;
  expectedFormat?: string;
  context?: Record<string, unknown>;
}

/**
 * Create an LLM task delegation response
 */
export function llmTaskResponse(
  task: LLMTask | string,
  instructions: string,
  parseFunction?: string
): MCPResponseWithContent {
  const taskObj = typeof task === 'string' ? { agentType: task, prompt: instructions } : task;
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        action: LLMAction.REQUIRE_CLAUDE_TASK,
        task: taskObj,
        instructions,
        parseFunction
      }, null, 2)
    }]
  };
}

/**
 * LLM task response structure
 */
export interface LLMTaskResponseData {
  action: string;
  task: LLMTask;
  instructions: string;
  parseFunction?: string;
}

/**
 * Check if a response is an LLM task request
 */
export function isLLMTaskResponse(response: unknown): response is LLMTaskResponseData {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  const r = response as Record<string, unknown>;
  return r.action === LLMAction.REQUIRE_CLAUDE_TASK ||
         r.type === 'llm_evaluation';
}

/**
 * Extract data from a response object
 */
export function extractResponseData<T = unknown>(
  response: MCPResponseWithContent
): T | string | null {
  if (!response?.content?.[0]?.text) {
    return null;
  }
  
  try {
    return JSON.parse(response.content[0].text) as T;
  } catch {
    return response.content[0].text;
  }
}

/**
 * Create a typed success response
 */
export function typedSuccessResponse<T>(data: T): MCPSuccessResponse<T> {
  return {
    success: true,
    data
  };
}

/**
 * Create a typed error response
 */
export function typedErrorResponse(
  error: string,
  code?: string,
  details?: unknown
): MCPErrorResponse {
  const response: MCPErrorResponse = {
    success: false,
    error
  };
  if (code !== undefined) {
    response.code = code;
  }
  if (details !== undefined) {
    response.details = details;
  }
  return response;
}

/**
 * Create a typed delegate response
 */
export function typedDelegateResponse(
  agentType: string,
  prompt: string,
  expectedFormat?: string
): MCPDelegateResponse {
  const response: MCPDelegateResponse = {
    action: 'require_claude_task',
    agentType,
    prompt
  };
  if (expectedFormat !== undefined) {
    response.expectedFormat = expectedFormat;
  }
  return response;
}

/**
 * Convert response to MCP format
 */
export function toMCPResponse<T>(
  response: MCPSuccessResponse<T> | MCPErrorResponse | MCPDelegateResponse
): MCPResponseWithContent {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }]
  };
}