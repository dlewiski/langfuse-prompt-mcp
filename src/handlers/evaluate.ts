/**
 * Evaluate Handler
 * Handles prompt evaluation requests with rule-based and LLM-based evaluation
 */

import { EvaluateSchema, type EvaluateInput } from '../tools/schemas.js';
import { evaluatePrompt } from '../evaluators/index.js';
import { 
  successResponse, 
  llmTaskResponse, 
  type LLMTask 
} from '../utils/response.js';
import type { EvaluationResult } from '../types/domain.js';
import type { MCPRequestContext } from '../types/mcp.js';

/**
 * Evaluation response types
 */
interface RuleBasedEvaluationResponse {
  type: 'rule_based';
  result: EvaluationResult;
}

interface LLMEvaluationResponse {
  type: 'llm_evaluation';
  agentTask: LLMTask | string;
}

type EvaluationResponse = RuleBasedEvaluationResponse | LLMEvaluationResponse | EvaluationResult;

/**
 * Handle evaluate tool requests
 * 
 * @param args - Raw arguments from MCP request
 * @param context - Optional request context
 * @returns MCP formatted response
 */
export async function handleEvaluate(
  args: unknown,
  _context?: MCPRequestContext
): Promise<ReturnType<typeof successResponse | typeof llmTaskResponse>> {
  // Validate input
  const { prompt, promptId }: EvaluateInput = EvaluateSchema.parse(args);
  
  // Perform evaluation (defaults to LLM-based)
  const result = await evaluatePrompt(prompt, promptId, true);
  
  // Check if this is an LLM evaluation request
  if (isLLMEvaluationResponse(result)) {
    // Return a special response that signals Claude Code to use Task
    return llmTaskResponse(
      result.agentTask,
      'Use the Task tool to execute this evaluation with the prompt-evaluation-judge agent',
      'parseLLMEvaluation'
    );
  }
  
  // Regular rule-based evaluation
  return successResponse(result);
}

/**
 * Type guard for LLM evaluation response
 */
function isLLMEvaluationResponse(
  response: EvaluationResponse
): response is LLMEvaluationResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'type' in response &&
    response.type === 'llm_evaluation'
  );
}

/**
 * Parse and validate evaluation results
 */
export function parseEvaluationResult(result: unknown): EvaluationResult {
  // Validate the result structure
  if (!isValidEvaluationResult(result)) {
    throw new Error('Invalid evaluation result format');
  }
  
  return result;
}

/**
 * Type guard for evaluation result
 */
function isValidEvaluationResult(value: unknown): value is EvaluationResult {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const result = value as Record<string, unknown>;
  
  return (
    'scores' in result &&
    typeof result.scores === 'object' &&
    'totalScore' in result &&
    typeof result.totalScore === 'number' &&
    'recommendations' in result &&
    Array.isArray(result.recommendations)
  );
}

/**
 * Export handler metadata for testing and documentation
 */
export const evaluateHandlerMetadata = {
  name: 'evaluate',
  description: 'Evaluate a prompt on multiple criteria',
  inputSchema: EvaluateSchema,
  supportsLLM: true,
  supportedModels: ['claude-sonnet-4', 'gpt-4', 'gemini-pro'],
} as const;