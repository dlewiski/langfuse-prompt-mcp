import { ImproveSchema } from "../tools/schemas.js";
import { evaluatePrompt } from "../evaluators/index.js";
import { applyImprovements } from "../improvers/index.js";
import { optimizePrompt } from "../improvers/modelOptimizer.js";

export async function handleImprove(args) {
  const { prompt, promptId, techniques, targetModel, enableModelOptimization } =
    ImproveSchema.parse(args);

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

  try {
    // First evaluate the current prompt
    const evaluation = await evaluatePrompt(prompt);

    // Check if this is an LLM evaluation request (needs Claude Code Task tool)
    if (evaluation.action === "require_claude_task") {
      // Return the request for Claude Code to handle
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                action: evaluation.action,
                task: evaluation.task,
                instructions: evaluation.instructions,
                parseFunction: evaluation.parseFunction,
                note: "Use the Task tool to execute this evaluation",
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Apply improvements based on evaluation
    const improved = await applyImprovements(prompt, evaluation, techniques);

    // Evaluate the improved version
    const improvedEvaluation = await evaluatePrompt(improved.text);

    // Handle LLM evaluation for improved version
    if (improvedEvaluation.action === "require_claude_task") {
      // Use a fallback score estimation for the improved version
      const estimatedScore =
        (evaluation.overallScore || 50) +
        improved.techniquesApplied.length * 10;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                original: {
                  text: prompt,
                  score: evaluation.overallScore || 0,
                },
                improved: {
                  text: improved.text,
                  score: Math.min(100, estimatedScore),
                  techniquesApplied: improved.techniquesApplied,
                  note: "Score estimated based on techniques applied",
                },
                improvement:
                  Math.min(100, estimatedScore) -
                  (evaluation.overallScore || 0),
                recommendations: evaluation.recommendations || [],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const result = {
      original: {
        text: prompt,
        score: evaluation.overallScore || 0,
      },
      improved: {
        text: improved.text,
        score: improvedEvaluation.overallScore || 0,
        techniquesApplied: improved.techniquesApplied,
      },
      improvement:
        (improvedEvaluation.overallScore || 0) - (evaluation.overallScore || 0),
      recommendations: improvedEvaluation.recommendations || [],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("[Improve] Error in handleImprove:", error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: "Failed to improve prompt",
              message: error.message,
              details: error.stack,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
