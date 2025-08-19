/**
 * Response utility for consistent MCP response formatting
 * 
 * Provides standardized response builders for success, error,
 * and special cases like LLM task delegation.
 */

import { RESPONSE_TYPE, LLM_ACTIONS } from '../constants.js';

/**
 * Create a standard JSON response
 * @param {Object} data - The data to return
 * @param {string} type - Response type (success, error, etc.)
 * @returns {Object} MCP-formatted response
 */
export function createResponse(data, type = RESPONSE_TYPE.SUCCESS) {
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
 * @param {Object} data - The success data
 * @returns {Object} MCP-formatted success response
 */
export function successResponse(data) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(data, null, 2)
    }]
  };
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} MCP-formatted error response
 */
export function errorResponse(message, details = {}) {
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
 * Create an LLM task delegation response
 * @param {Object} task - The task configuration for Claude Code
 * @param {string} instructions - Instructions for the task
 * @param {string} parseFunction - Function name to parse results
 * @returns {Object} MCP-formatted LLM task response
 */
export function llmTaskResponse(task, instructions, parseFunction) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        action: LLM_ACTIONS.REQUIRE_CLAUDE_TASK,
        task,
        instructions,
        parseFunction
      }, null, 2)
    }]
  };
}

/**
 * Check if a response is an LLM task request
 * @param {Object} response - Response to check
 * @returns {boolean} True if response requires LLM task
 */
export function isLLMTaskResponse(response) {
  return response?.action === LLM_ACTIONS.REQUIRE_CLAUDE_TASK ||
         response?.type === 'llm_evaluation';
}

/**
 * Extract data from a response object
 * @param {Object} response - The response object
 * @returns {Object} Extracted data
 */
export function extractResponseData(response) {
  if (!response?.content?.[0]?.text) {
    return null;
  }
  
  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return response.content[0].text;
  }
}