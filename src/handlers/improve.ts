/**
 * Improve Handler
 * Handles prompt improvement requests with model-specific optimizations
 */

import { ImproveSchema, type ImproveInput } from '../tools/schemas.js';
import { evaluatePrompt } from '../evaluators/index.js';
import { applyImprovements } from '../improvers/index.js';
import { optimizePrompt } from '../improvers/modelOptimizer.js';
import { 
  successResponse, 
  errorResponse, 
  llmTaskResponse, 
  isLLMTaskResponse 
} from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import type { 
  EvaluationResult,
  ImprovementTechnique,
  TargetModel
} from '../types/domain.js';
import type { MCPRequestContext } from '../types/mcp.js';

/**
 * Prompt version information
 */
interface PromptVersion {
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Improved prompt version with techniques
 */
interface ImprovedPromptVersion extends PromptVersion {
  techniques: ImprovementTechnique[];
  note?: string;
}

/**
 * Improvement response structure
 */
interface ImprovementResponse {
  original: PromptVersion;
  improved: ImprovedPromptVersion;
  improvement: number;
  recommendations: string[];
  modelOptimization?: {
    model: TargetModel;
    optimizations: string[];
  };
}

/**
 * Handle improve tool requests
 * 
 * @param args - Raw arguments from MCP request
 * @param context - Optional request context
 * @returns MCP formatted response
 */
export async function handleImprove(
  args: unknown,
  _context?: MCPRequestContext
): Promise<ReturnType<typeof successResponse | typeof errorResponse | typeof llmTaskResponse>> {
  const { 
    prompt, 
    promptId, 
    techniques, 
    targetModel, 
    enableModelOptimization 
  }: ImproveInput = ImproveSchema.parse(args);

  try {
    // Apply model-specific optimization if enabled
    let workingPrompt = prompt;
    let modelOptimizationResult: { 
      optimized: string; 
      model: TargetModel; 
      optimizations: string[] 
    } | null = null;

    if (enableModelOptimization !== false && targetModel) {
      modelOptimizationResult = await optimizePrompt(prompt, {
        targetModel,
        applyBase: true,
        complexity: techniques?.includes('chainOfThought') ? 'high' : 'medium',
      });
      workingPrompt = modelOptimizationResult.optimized;
    }

    // First evaluate the current prompt
    const evaluation = await evaluatePrompt(prompt, promptId);

    // Check if this is an LLM evaluation request
    if (isLLMTaskResponse(evaluation)) {
      return llmTaskResponse(
        (evaluation as any).task || (evaluation as any).agentTask,
        (evaluation as any).instructions || 'Use the Task tool to execute this evaluation',
        (evaluation as any).parseFunction || 'parseLLMEvaluation'
      );
    }

    const evalResult = evaluation as EvaluationResult;

    // Apply improvements based on evaluation
    const improved = await applyImprovements(
      workingPrompt, 
      evalResult, 
      techniques as ImprovementTechnique[]
    );

    // Evaluate the improved version
    const improvedEvaluation = await evaluatePrompt(improved.improvedPrompt);

    // Handle LLM evaluation for improved version with fallback
    if (isLLMTaskResponse(improvedEvaluation)) {
      const estimatedScore = calculateEstimatedScore(
        evalResult.totalScore,
        improved.techniques.length
      );

      const response: ImprovementResponse = {
        original: createPromptVersion(prompt, evalResult.totalScore),
        improved: createImprovedVersion(
          improved.improvedPrompt,
          estimatedScore,
          improved.techniques,
          'Score estimated based on techniques applied'
        ),
        improvement: estimatedScore - evalResult.totalScore,
        recommendations: evalResult.recommendations || [],
      };

      if (modelOptimizationResult) {
        response.modelOptimization = {
          model: modelOptimizationResult.model,
          optimizations: modelOptimizationResult.optimizations,
        };
      }

      return successResponse(response);
    }

    const improvedEvalResult = improvedEvaluation as EvaluationResult;

    // Regular response with actual evaluation scores
    const response: ImprovementResponse = {
      original: createPromptVersion(prompt, evalResult.totalScore),
      improved: createImprovedVersion(
        improved.improvedPrompt,
        improvedEvalResult.totalScore,
        improved.techniques
      ),
      improvement: improvedEvalResult.totalScore - evalResult.totalScore,
      recommendations: improvedEvalResult.recommendations || [],
    };

    if (modelOptimizationResult) {
      response.modelOptimization = {
        model: modelOptimizationResult.model,
        optimizations: modelOptimizationResult.optimizations,
      };
    }

    return successResponse(response);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    handlerLogger.error('Error in handleImprove:', errorMessage);
    
    return errorResponse('Failed to improve prompt', {
      message: errorMessage,
      promptId,
    });
  }
}

/**
 * Create a prompt version object
 */
function createPromptVersion(text: string, score: number): PromptVersion {
  return {
    text,
    score: Math.round(score * 100) / 100,
  };
}

/**
 * Create an improved prompt version object
 */
function createImprovedVersion(
  text: string,
  score: number,
  techniques: ImprovementTechnique[],
  note?: string
): ImprovedPromptVersion {
  const version: ImprovedPromptVersion = {
    text,
    score: Math.round(score * 100) / 100,
    techniques,
  };
  
  if (note) {
    version.note = note;
  }
  
  return version;
}

/**
 * Calculate estimated score based on techniques applied
 */
function calculateEstimatedScore(
  originalScore: number,
  techniqueCount: number
): number {
  // Estimate 3-5 points improvement per technique, with diminishing returns
  const baseImprovement = techniqueCount * 4;
  const diminishingFactor = Math.pow(0.9, techniqueCount - 1);
  const improvement = baseImprovement * diminishingFactor;
  
  // Cap at 95 to avoid unrealistic scores
  return Math.min(95, originalScore + improvement);
}

/**
 * Export handler metadata for testing and documentation
 */
export const improveHandlerMetadata = {
  name: 'improve',
  description: 'Improve a prompt with techniques and model-specific optimizations',
  inputSchema: ImproveSchema,
  supportsLLM: true,
  supportedModels: ['claude', 'gpt', 'gemini'] as const,
  techniques: [
    'chainOfThought',
    'xmlStructure',
    'examples',
    'errorHandling',
    'successCriteria',
    'performance',
    'outputFormat',
    'techSpecificity'
  ] as const,
} as const;