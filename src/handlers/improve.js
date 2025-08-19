import { ImproveSchema } from "../tools/schemas.js";
import { evaluatePrompt } from "../evaluators/index.js";
import { applyImprovements } from "../improvers/index.js";
import { optimizePrompt } from "../improvers/modelOptimizer.js";
import { successResponse, errorResponse, llmTaskResponse, isLLMTaskResponse } from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import { IMPROVEMENT, LLM_ACTIONS } from '../constants.js';

export async function handleImprove(args) {
  const { prompt, promptId, techniques, targetModel, enableModelOptimization } =
    ImproveSchema.parse(args);

  try {
    // Apply model-specific optimization if enabled
    let workingPrompt = prompt;
    let modelOptimizationResult = null;

    if (enableModelOptimization !== false) {
      modelOptimizationResult = await optimizePrompt(prompt, {
        targetModel,
        applyBase: true,
        complexity: techniques?.includes("chainOfThought") ? "high" : "medium",
      });
      workingPrompt = modelOptimizationResult.optimized;
    }

    // First evaluate the current prompt
    const evaluation = await evaluatePrompt(prompt);

    // Check if this is an LLM evaluation request
    if (isLLMTaskResponse(evaluation)) {
      return llmTaskResponse(
        evaluation.task || evaluation.agentTask,
        evaluation.instructions || "Use the Task tool to execute this evaluation",
        evaluation.parseFunction || 'parseLLMEvaluation'
      );
    }

    // Apply improvements based on evaluation
    const improved = await applyImprovements(prompt, evaluation, techniques);

    // Evaluate the improved version
    const improvedEvaluation = await evaluatePrompt(improved.text);

    // Handle LLM evaluation for improved version with fallback
    if (isLLMTaskResponse(improvedEvaluation)) {
      const estimatedScore = calculateEstimatedScore(
        evaluation.overallScore,
        improved.techniquesApplied.length
      );

      return successResponse({
        original: createPromptVersion(prompt, evaluation.overallScore),
        improved: createImprovedVersion(
          improved.text,
          estimatedScore,
          improved.techniquesApplied,
          "Score estimated based on techniques applied"
        ),
        improvement: estimatedScore - (evaluation.overallScore || 0),
        recommendations: evaluation.recommendations || [],
      });
    }

    // Regular response with actual evaluation scores
    return successResponse({
      original: createPromptVersion(prompt, evaluation.overallScore),
      improved: createImprovedVersion(
        improved.text,
        improvedEvaluation.overallScore,
        improved.techniquesApplied
      ),
      improvement: (improvedEvaluation.overallScore || 0) - (evaluation.overallScore || 0),
      recommendations: improvedEvaluation.recommendations || [],
    });

  } catch (error) {
    handlerLogger.error("Error in handleImprove:", error.message);
    return errorResponse("Failed to improve prompt", {
      message: error.message,
      details: error.stack,
    });
  }
}

/**
 * Calculate estimated score based on techniques applied
 */
function calculateEstimatedScore(baseScore, techniqueCount) {
  const score = (baseScore || 50) + (techniqueCount * IMPROVEMENT.SCORE_PER_TECHNIQUE);
  return Math.min(IMPROVEMENT.MAX_SCORE, score);
}

/**
 * Create prompt version object
 */
function createPromptVersion(text, score) {
  return {
    text,
    score: score || 0,
  };
}

/**
 * Create improved version object
 */
function createImprovedVersion(text, score, techniquesApplied, note = null) {
  const version = {
    text,
    score: score || 0,
    techniquesApplied,
  };
  
  if (note) {
    version.note = note;
  }
  
  return version;
}
