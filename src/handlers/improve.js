import { ImproveSchema } from "../tools/schemas.js";
import { evaluatePrompt } from "../evaluators/index.js";
import { applyImprovements } from "../improvers/index.js";
import { optimizePrompt } from "../improvers/modelOptimizer.js";
import { successResponse, errorResponse, llmTaskResponse, isLLMTaskResponse } from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import { 
  calculateEstimatedScore,
  createPromptVersion,
  createImprovedVersion,
  createImprovementResult,
} from './helpers.js';

/**
 * Apply model optimization if enabled
 */
async function applyModelOptimization(prompt, options) {
  const { targetModel, techniques, enableModelOptimization } = options;
  
  if (enableModelOptimization === false) {
    return { prompt, optimizationApplied: false };
  }
  
  const result = await optimizePrompt(prompt, {
    targetModel,
    applyBase: true,
    complexity: techniques?.includes("chainOfThought") ? "high" : "medium",
  });
  
  return {
    prompt: result.optimized,
    optimizationApplied: true,
    optimizationResult: result,
  };
}

/**
 * Handle LLM evaluation response
 */
function handleLLMEvaluation(evaluation, improved, originalScore) {
  const estimatedScore = calculateEstimatedScore(
    originalScore,
    improved.techniquesApplied.length
  );
  
  return successResponse({
    original: createPromptVersion(improved.originalText, originalScore),
    improved: createImprovedVersion(
      improved.text,
      estimatedScore,
      improved.techniquesApplied,
      "Score estimated based on techniques applied"
    ),
    improvement: estimatedScore - (originalScore || 0),
    recommendations: improved.recommendations || [],
  });
}

export async function handleImprove(args) {
  const parsed = ImproveSchema.parse(args);
  const { prompt, promptId, techniques, targetModel, enableModelOptimization } = parsed;

  try {
    // Step 1: Apply model-specific optimization if enabled
    const { prompt: workingPrompt } = await applyModelOptimization(prompt, {
      targetModel,
      techniques,
      enableModelOptimization,
    });

    // Step 2: Evaluate the current prompt
    const evaluation = await evaluatePrompt(workingPrompt);

    // Check if this is an LLM evaluation request
    if (isLLMTaskResponse(evaluation)) {
      return llmTaskResponse(
        evaluation.task || evaluation.agentTask,
        evaluation.instructions || "Use the Task tool to execute this evaluation",
        evaluation.parseFunction || 'parseLLMEvaluation'
      );
    }

    // Step 3: Apply improvements based on evaluation
    const improved = await applyImprovements(workingPrompt, evaluation, techniques);
    improved.originalText = prompt; // Keep reference to original

    // Step 4: Evaluate the improved version
    const improvedEvaluation = await evaluatePrompt(improved.text);

    // Handle LLM evaluation for improved version with fallback
    if (isLLMTaskResponse(improvedEvaluation)) {
      return handleLLMEvaluation(evaluation, improved, evaluation.overallScore);
    }

    // Step 5: Return improvement result
    return successResponse(
      createImprovementResult(
        { text: prompt, score: evaluation.overallScore },
        { 
          text: improved.text, 
          score: improvedEvaluation.overallScore,
          recommendations: improvedEvaluation.recommendations,
        },
        improved.techniquesApplied
      )
    );

  } catch (error) {
    handlerLogger.error("Error in handleImprove:", error.message);
    return errorResponse("Failed to improve prompt", {
      message: error.message,
      details: error.stack,
    });
  }
}

