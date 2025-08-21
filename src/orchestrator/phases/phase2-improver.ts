/**
 * Phase 2: Conditional Improvement
 * Handles improvement logic with parallel specialist agents
 */

import { mcp__langfuse_prompt__improve } from "../../tools/mcp-tools.js";
import { Context } from "./phase1-analyzer.js";
import { createModuleLogger } from "../../utils/structuredLogger.js";

export interface Phase2Results {
  improved: boolean;
  bestImprovement?: {
    prompt: string;
    method: string;
    scoreImprovement: number;
  };
  improvedTracking?: any;
  improvedEvaluation?: any;
}

export class Phase2Improver {
  private config: any;
  private logger = createModuleLogger('Phase2Improver');

  constructor(config: any) {
    this.config = config;
  }

  async execute(
    prompt: string,
    currentScore: number,
    context: Context
  ): Promise<Phase2Results> {
    this.logger.info("🐝 Phase 2: Conditional Improvement", { currentScore });

    // Check if improvement is needed
    if (currentScore >= this.config.thresholds.high_quality) {
      this.logger.info("✅ Prompt quality sufficient, skipping improvement");
      return { improved: false };
    }

    // Select improvement agents based on context
    const agents = this.selectImprovementAgents(context);
    this.logger.info("🐝 Selected improvement agents", { agents });

    // Spawn improvement agents in parallel
    const improvements = await Promise.all(
      agents.map(agent => this.improvePrompt(agent, { prompt, context }))
    );

    // Filter successful improvements
    const validImprovements = improvements.filter(
      imp => imp && imp.prompt && imp.scoreImprovement > 0
    );

    if (validImprovements.length === 0) {
      this.logger.warn("⚠️ No valid improvements generated");
      return { improved: false };
    }

    // Select best improvement
    const best = this.selectBestImprovement(validImprovements);
    this.logger.info("🐝 Best improvement", { method: best.method, scoreImprovement: best.scoreImprovement });

    return {
      improved: true,
      bestImprovement: best,
    };
  }

  private selectImprovementAgents(context: Context): string[] {
    const agents: string[] = [];

    // Always include general optimizer for complex prompts
    if (context.complexity === "high") {
      agents.push("claude4-opus-prompt-optimizer");
    }

    // Add context-specific specialists
    if (context.isReact || context.hasFrontend) {
      agents.push("react-prompt-specialist");
    }

    if (context.isAPI || context.hasBackend) {
      agents.push("api-prompt-expert");
    }

    // Add coordinator for very complex cases
    if (context.complexity === "high" && agents.length > 1) {
      agents.push("prompt-llm-coordinator");
    }

    // Default to general optimizer if no specific agents selected
    if (agents.length === 0) {
      agents.push("claude4-opus-prompt-optimizer");
    }

    return agents;
  }

  private async improvePrompt(agentType: string, params: any): Promise<any> {
    try {
      // Customize parameters based on agent type
      const improveParams = {
        ...params,
        targetModel: this.getTargetModel(agentType),
        techniques: this.getTechniques(agentType, params.context),
      };

      const result = await mcp__langfuse_prompt__improve(improveParams);
      
      if (result?.improved) {
        return {
          prompt: result.improved,
          method: agentType,
          scoreImprovement: result.scoreImprovement || 10,
        };
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`⚠️ Improvement failed for ${agentType}`, error);
      return null;
    }
  }

  private selectBestImprovement(improvements: any[]): any {
    // Sort by score improvement descending
    improvements.sort((a, b) => b.scoreImprovement - a.scoreImprovement);

    // Return the best improvement
    return improvements[0];
  }

  private getTargetModel(agentType: string): string {
    const modelMap: Record<string, string> = {
      "claude4-opus-prompt-optimizer": "claude",
      "react-prompt-specialist": "claude",
      "api-prompt-expert": "gpt",
      "prompt-llm-coordinator": "claude",
    };

    return modelMap[agentType] || "claude";
  }

  private getTechniques(_agentType: string, context: Context): string[] {
    const techniques: string[] = [];

    if (context.complexity === "high") {
      techniques.push("chain_of_thought", "few_shot_examples");
    }

    if (context.isReact || context.hasFrontend) {
      techniques.push("component_structure", "accessibility_focus");
    }

    if (context.isAPI || context.hasBackend) {
      techniques.push("error_handling", "validation_emphasis");
    }

    if (techniques.length === 0) {
      techniques.push("clarity", "specificity");
    }

    return techniques;
  }
}