/**
 * Phase 3: Finalization and Storage
 * Handles final tracking and evaluation of improved prompts
 */

import {
  mcp__langfuse_prompt__track,
  mcp__langfuse_prompt__evaluate,
} from "../../tools/mcp-tools.js";
import { Phase2Results } from "./phase2-improver.js";
import { createModuleLogger } from "../../utils/structuredLogger.js";

export interface Phase3Results {
  finalPrompt: string;
  finalScore: number;
  improvement?: number;
  metadata: any;
}

export class Phase3Finalizer {
  private logger = createModuleLogger('Phase3Finalizer');

  async execute(
    originalPrompt: string,
    originalScore: number,
    phase2Results: Phase2Results
  ): Promise<Phase3Results> {
    this.logger.info("🐝 Phase 3: Finalization and Storage");

    const finalPrompt = phase2Results.improved && phase2Results.bestImprovement
      ? phase2Results.bestImprovement.prompt
      : originalPrompt;

    let finalScore = originalScore;
    let improvedTracking = null;
    let improvedEvaluation = null;

    // If prompt was improved, track and evaluate the new version
    if (phase2Results.improved && phase2Results.bestImprovement) {
      [improvedTracking, improvedEvaluation] = await Promise.all([
        this.trackImprovedPrompt(finalPrompt, phase2Results.bestImprovement),
        this.evaluateImprovedPrompt(finalPrompt),
      ]);

      if (improvedEvaluation?.score) {
        finalScore = improvedEvaluation.score;
      }
    }

    const improvement = finalScore - originalScore;

    this.logger.info(`🐝 Final score: ${finalScore}`, { improvement: `${improvement >= 0 ? '+' : ''}${improvement}` });

    return {
      finalPrompt,
      finalScore,
      ...(improvement > 0 && { improvement }),
      metadata: {
        originalScore,
        improved: phase2Results.improved,
        method: phase2Results.bestImprovement?.method,
        tracking: improvedTracking,
        evaluation: improvedEvaluation,
      },
    };
  }

  private async trackImprovedPrompt(prompt: string, improvement: any): Promise<any> {
    try {
      const result = await mcp__langfuse_prompt__track({
        prompt,
        metadata: {
          improved: true,
          method: improvement.method,
          scoreImprovement: improvement.scoreImprovement,
        },
      });
      return result;
    } catch (error) {
      this.logger.warn("⚠️ Failed to track improved prompt", error);
      return null;
    }
  }

  private async evaluateImprovedPrompt(prompt: string): Promise<any> {
    try {
      const result = await mcp__langfuse_prompt__evaluate({ prompt });
      return result;
    } catch (error) {
      this.logger.warn("⚠️ Failed to evaluate improved prompt", error);
      return null;
    }
  }
}