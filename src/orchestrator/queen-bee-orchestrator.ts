/**
 * Queen Bee Orchestrator - Central coordinator for all prompt operations
 *
 * This orchestrator automatically activates for every user prompt and coordinates
 * multiple sub-agents in parallel for maximum efficiency.
 *
 * Architecture:
 * - Phase 1: Parallel initial analysis (tracking, evaluation, context)
 * - Phase 2: Conditional improvement with parallel specialist agents
 * - Phase 3: Finalization and storage
 * - Phase 4: Async pattern extraction
 */

import {
  mcp__langfuse_prompt__track,
  mcp__langfuse_prompt__evaluate,
  mcp__langfuse_prompt__improve,
  mcp__langfuse_prompt__patterns,
} from "../tools/mcp-tools.js";

interface Context {   
  isReact: boolean;
  hasFrontend: boolean;
  isAPI: boolean;
  hasBackend: boolean;
  complexity: "low" | "medium" | "high";
  frameworks: string[];
  projectType?: string;
}

interface Phase1Results {
  tracking: any;
  evaluation: { score: number; details: any };
  context: Context;
}

interface Phase2Results {
  improved: boolean;
  bestImprovement?: {
    prompt: string;
    method: string;
    scoreImprovement: number;
  };
  improvedTracking?: any;
  improvedEvaluation?: any;
}

interface PromptHistoryItem {
  prompt: string;
  score: number;
  timestamp: number;
  context?: Context;
  improvements?: string[];
}

interface OrchestratorConfig {
  activation: {
    automatic: boolean;
    manual_override: boolean;
    debug_mode: boolean;
  };
  parallelization: {
    max_concurrent_agents: number;
    timeout_ms: number;
    retry_on_failure: boolean;
    fallback_mode: string;
  };
  thresholds: {
    improvement_trigger: number;
    high_quality: number;
    pattern_extraction_min: number;
  };
  agent_selection: {
    always_include: string[];
    context_based: {
      [key: string]: string[];
    };
  };
  debug_mode?: boolean; // Add debug_mode at the top level for compatibility
}

export class QueenBeeOrchestrator {
  private activeAgents: Map<string, Promise<any>> = new Map();
  private promptHistory: PromptHistoryItem[] = [];
  private config: OrchestratorConfig;
  private static instance: QueenBeeOrchestrator | null = null;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      activation: {
        automatic: true,
        manual_override: false,
        debug_mode: true,
        ...config?.activation,
      },
      parallelization: {
        max_concurrent_agents: 5,
        timeout_ms: 5000,
        retry_on_failure: true,
        fallback_mode: "basic_tracking",
        ...config?.parallelization,
      },
      thresholds: {
        improvement_trigger: 70,
        high_quality: 85,
        pattern_extraction_min: 10,
        ...config?.thresholds,
      },
      agent_selection: {
        always_include: ["prompt-auto-tracker", "prompt-evaluation-judge"],
        context_based: {
          react: ["react-prompt-specialist"],
          api: ["api-prompt-expert"],
          complex: ["prompt-llm-coordinator", "claude4-opus-prompt-optimizer"],
          ...config?.agent_selection?.context_based,
        },
        ...config?.agent_selection,
      },
    };

    if (this.config.activation.automatic) {
      this.setupAutoActivation();
    }
  }

  static getInstance(
    config?: Partial<OrchestratorConfig>
  ): QueenBeeOrchestrator {
    if (!QueenBeeOrchestrator.instance) {
      QueenBeeOrchestrator.instance = new QueenBeeOrchestrator(config);
    }
    return QueenBeeOrchestrator.instance;
  }

  private setupAutoActivation(): void {
    // Hook into Claude Code to intercept ALL prompts
    // This would be integrated with Claude Code's event system
    if (this.config.activation.debug_mode) {
      console.log("🐝 Queen Bee Orchestrator: Auto-activation setup complete");
      console.log("🐝 Configuration:", JSON.stringify(this.config, null, 2));
    }
  }

  /**
   * Main orchestration method - processes every user prompt
   */
  async orchestrate(userPrompt: string): Promise<any> {
    const startTime = Date.now();

    if (this.config.activation.debug_mode) {
      console.log("🐝 Queen Bee Orchestrator: Processing prompt");
      console.log("🐝 Prompt length:", userPrompt.length);
    }

    try {
      // Phase 1: Parallel Initial Analysis
      const phase1Results = await this.executePhase1(userPrompt);

      // Phase 2: Conditional Improvement (parallel)
      const phase2Results = await this.executePhase2(userPrompt, phase1Results);

      // Phase 3: Finalization and Storage
      await this.executePhase3(userPrompt, phase1Results, phase2Results);

      // Phase 4: Async Pattern Extraction (non-blocking)
      this.executePhase4Async();

      const executionTime = Date.now() - startTime;

      if (this.config.activation.debug_mode) {
        console.log(`🐝 Orchestration complete in ${executionTime}ms`);
        console.log(
          `🐝 Final score: ${
            phase2Results.improved
              ? phase2Results.improvedEvaluation?.score
              : phase1Results.evaluation.score
          }`
        );
      }

      return {
        success: true,
        originalPrompt: userPrompt,
        finalPrompt: phase2Results.improved
          ? phase2Results.bestImprovement?.prompt
          : userPrompt,
        originalScore: phase1Results.evaluation.score,
        finalScore: phase2Results.improved
          ? phase2Results.improvedEvaluation?.score
          : phase1Results.evaluation.score,
        improved: phase2Results.improved,
        executionTime,
        context: phase1Results.context,
      };
    } catch (error) {
      console.error("🐝 Orchestrator error:", error);
      // Fallback to basic tracking
      await this.fallbackTracking(userPrompt);
      throw error;
    }
  }

  /**
   * Phase 1: Parallel Initial Analysis
   */
  private async executePhase1(prompt: string): Promise<Phase1Results> {
    if (this.config.activation.debug_mode) {
      console.log("🐝 Phase 1: Parallel Initial Analysis");
    }

    // Spawn all analysis agents in parallel
    const [tracking, evaluation, context] = await Promise.all([
      this.spawnAgentWithTimeout("prompt-auto-tracker", {
        action: "track",
        prompt: prompt,
        metadata: { stage: "initial", timestamp: new Date().toISOString() },
      }),

      this.spawnAgentWithTimeout("prompt-evaluation-judge", {
        action: "evaluate",
        prompt: prompt,
      }),

      this.analyzeContext(prompt),
    ]);

    return { tracking, evaluation, context };
  }

  /**
   * Phase 2: Conditional Improvement
   */
  private async executePhase2(
    prompt: string,
    phase1: Phase1Results
  ): Promise<Phase2Results> {
    if (this.config.activation.debug_mode) {
      console.log("🐝 Phase 2: Conditional Improvement");
      console.log(`🐝 Current score: ${phase1.evaluation.score}`);
    }

    // Only improve if score is below threshold
    if (phase1.evaluation.score >= this.config.thresholds.improvement_trigger) {
      console.log("✅ Prompt quality sufficient, skipping improvement");
      return { improved: false };
    }

    // Select appropriate improvement agents based on context
    const improvementAgents = this.selectImprovementAgents(phase1.context);

    if (this.config.activation.debug_mode) {
      console.log("🐝 Selected improvement agents:", improvementAgents);
    }

    // Spawn improvement agents in parallel
    const improvements = await Promise.all(
      improvementAgents.map((agentType) =>
        this.spawnAgentWithTimeout(agentType, {
          action: "improve",
          prompt: prompt,
          evaluation: phase1.evaluation,
          context: phase1.context,
        })
      )
    );

    // Select best improvement
    const bestImprovement = this.selectBestImprovement(improvements);

    if (!bestImprovement) {
      return { improved: false };
    }

    // Re-evaluate improved prompt in parallel
    const [improvedTracking, improvedEvaluation] = await Promise.all([
      this.spawnAgentWithTimeout("prompt-auto-tracker", {
        action: "track",
        prompt: bestImprovement.prompt,
        metadata: {
          stage: "improved",
          original_score: phase1.evaluation.score,
          improvement_method: bestImprovement.method,
          timestamp: new Date().toISOString(),
        },
      }),

      this.spawnAgentWithTimeout("prompt-evaluation-judge", {
        action: "evaluate",
        prompt: bestImprovement.prompt,
      }),
    ]);

    return {
      improved: true,
      bestImprovement,
      improvedTracking,
      improvedEvaluation,
    };
  }

  /**
   * Phase 3: Finalization and Storage
   */
  private async executePhase3(
    originalPrompt: string,
    phase1: Phase1Results,
    phase2: Phase2Results
  ): Promise<void> {
    if (this.config.activation.debug_mode) {
      console.log("🐝 Phase 3: Finalization and Storage");
    }

    const finalPrompt =
      phase2.improved && phase2.bestImprovement
        ? phase2.bestImprovement.prompt
        : originalPrompt;

    const finalScore =
      phase2.improved && phase2.improvedEvaluation
        ? phase2.improvedEvaluation.score
        : phase1.evaluation.score;

    // Save to Langfuse with complete metadata
    await this.saveToLangfuse({
      original: originalPrompt,
      final: finalPrompt,
      originalScore: phase1.evaluation.score,
      finalScore: finalScore,
      improved: phase2.improved,
      context: phase1.context,
      timestamp: new Date().toISOString(),
      improvementMethod: phase2.bestImprovement?.method,
    });

    // Update prompt history
    this.promptHistory.push({
      prompt: finalPrompt,
      score: finalScore,
      timestamp: Date.now(),
      context: phase1.context,
      improvements:
        phase2.improved && phase2.bestImprovement
          ? [phase2.bestImprovement.method]
          : undefined,
    });

    // Trim history if too large
    if (this.promptHistory.length > 100) {
      this.promptHistory = this.promptHistory.slice(-100);
    }
  }

  /**
   * Phase 4: Async Pattern Extraction
   */
  private executePhase4Async(): void {
    if (this.config.activation.debug_mode) {
      console.log("🐝 Phase 4: Async Pattern Extraction");
    }

    // Check if we have enough high-scoring prompts
    const highScoringPrompts = this.promptHistory.filter(
      (p) => p.score >= this.config.thresholds.high_quality
    );

    if (
      highScoringPrompts.length >= this.config.thresholds.pattern_extraction_min
    ) {
      // Spawn pattern extractor asynchronously (don't await)
      this.spawnAgent("prompt-pattern-extractor", {
        action: "extract",
        prompts: highScoringPrompts,
        minScore: this.config.thresholds.high_quality,
      })
        .then((patterns) => {
          if (this.config.activation.debug_mode) {
            console.log("📊 Patterns extracted:", patterns);
          }
          this.applyPatterns(patterns);
        })
        .catch((error) => {
          console.error("Pattern extraction failed:", error);
        });
    }
  }

  /**
   * Spawn an agent with timeout handling
   */
  private async spawnAgentWithTimeout(
    agentType: string,
    params: any,
    timeout?: number
  ): Promise<any> {
    const timeoutMs = timeout || this.config.parallelization.timeout_ms;

    return Promise.race([
      this.spawnAgent(agentType, params),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`${agentType} timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]).catch((error) => {
      if (this.config.parallelization.retry_on_failure) {
        console.warn(`🐝 Retrying ${agentType} after error:`, error.message);
        return this.spawnAgent(agentType, params);
      }
      throw error;
    });
  }

  /**
   * Spawn a sub-agent using Claude Code's Task tool
   */
  private async spawnAgent(agentType: string, params: any): Promise<any> {
    // Track active agents
    const agentPromise = this.executeAgent(agentType, params);
    this.activeAgents.set(`${agentType}-${Date.now()}`, agentPromise);

    try {
      const result = await agentPromise;
      return result;
    } finally {
      // Clean up tracking
      this.activeAgents.delete(`${agentType}-${Date.now()}`);
    }
  }

  /**
   * Execute agent based on type
   */
  private async executeAgent(agentType: string, params: any): Promise<any> {
    // This would integrate with Claude Code's Task tool
    // For now, we'll simulate the response structure

    switch (agentType) {
      case "prompt-auto-tracker":
        return this.trackPrompt(params);

      case "prompt-evaluation-judge":
        return this.evaluatePrompt(params);

      case "prompt-pattern-extractor":
        return this.extractPatterns(params);

      case "claude4-opus-prompt-optimizer":
      case "react-prompt-specialist":
      case "api-prompt-expert":
      case "prompt-llm-coordinator":
        return this.improvePrompt(agentType, params);

      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  /**
   * Track a prompt to Langfuse
   */
  private async trackPrompt(params: any): Promise<any> {
    try {
      return await mcp__langfuse_prompt__track({
        prompt: params.prompt,
        metadata: params.metadata,
        category: "orchestrated",
        quickScore: params.score,
      });
    } catch (error) {
      console.error("Tracking failed:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Evaluate a prompt
   */
  private async evaluatePrompt(params: any): Promise<any> {
    try {
      const result = await mcp__langfuse_prompt__evaluate({
        prompt: params.prompt,
        promptId: params.promptId,
      });

      // Parse the evaluation result
      if (result.action === "require_claude_task") {
        // This would trigger Claude Code's Task tool
        // For now, simulate a response
        return {
          score: this.simulateScore(params.prompt),
          details: {
            clarity: 8,
            structure: 7,
            examples: 6,
            techSpecificity: 8,
          },
        };
      }

      return result;
    } catch (error) {
      console.error("Evaluation failed:", error);
      return { score: 50, details: {} };
    }
  }

  /**
   * Improve a prompt using specified agent
   */
  private async improvePrompt(agentType: string, params: any): Promise<any> {
    try {
      const result = await mcp__langfuse_prompt__improve({
        prompt: params.prompt,
        targetModel: this.getTargetModel(agentType),
        techniques: this.getTechniques(agentType, params.context),
      });

      return {
        prompt: result.improvedPrompt || params.prompt,
        method: agentType,
        scoreImprovement: result.scoreImprovement || 10,
      };
    } catch (error) {
      console.error(`Improvement with ${agentType} failed:`, error);
      return null;
    }
  }

  /**
   * Extract patterns from high-scoring prompts
   */
  private async extractPatterns(params: any): Promise<any> {
    try {
      return await mcp__langfuse_prompt__patterns({
        limit: params.prompts?.length || 100,
        minScore: params.minScore || 80,
      });
    } catch (error) {
      console.error("Pattern extraction failed:", error);
      return { patterns: [] };
    }
  }

  /**
   * Select improvement agents based on context
   */
  private selectImprovementAgents(context: Context): string[] {
    const agents: string[] = ["claude4-opus-prompt-optimizer"]; // Always include

    if (context.isReact || context.hasFrontend) {
      agents.push("react-prompt-specialist");
    }

    if (context.isAPI || context.hasBackend) {
      agents.push("api-prompt-expert");
    }

    // Add coordinator for complex contexts
    if (context.complexity === "high") {
      agents.push("prompt-llm-coordinator");
    }

    // Limit to max concurrent agents
    return agents.slice(0, this.config.parallelization.max_concurrent_agents);
  }

  /**
   * Select the best improvement from multiple options
   */
  private selectBestImprovement(improvements: any[]): any {
    const validImprovements = improvements.filter((imp) => imp && imp.prompt);

    if (validImprovements.length === 0) {
      return null;
    }

    // Select improvement with highest score gain
    return validImprovements.reduce((best, current) =>
      (current.scoreImprovement || 0) > (best.scoreImprovement || 0)
        ? current
        : best
    );
  }

  /**
   * Analyze context from prompt
   */
  private async analyzeContext(prompt: string): Promise<Context> {
    const promptLower = prompt.toLowerCase();

    // Parallel context detection
    const [reactKeywords, apiKeywords, complexity, frameworks] =
      await Promise.all([
        this.detectReactContext(promptLower),
        this.detectAPIContext(promptLower),
        this.assessComplexity(prompt),
        this.detectFrameworks(promptLower),
      ]);

    return {
      isReact: reactKeywords,
      hasFrontend:
        reactKeywords ||
        promptLower.includes("ui") ||
        promptLower.includes("component"),
      isAPI: apiKeywords,
      hasBackend:
        apiKeywords ||
        promptLower.includes("server") ||
        promptLower.includes("database"),
      complexity: complexity,
      frameworks: frameworks,
    };
  }

  /**
   * Detect React context
   */
  private async detectReactContext(prompt: string): Promise<boolean> {
    const reactKeywords = [
      "react",
      "component",
      "jsx",
      "tsx",
      "hook",
      "state",
      "props",
    ];
    return reactKeywords.some((keyword) => prompt.includes(keyword));
  }

  /**
   * Detect API context
   */
  private async detectAPIContext(prompt: string): Promise<boolean> {
    const apiKeywords = [
      "api",
      "endpoint",
      "rest",
      "graphql",
      "http",
      "request",
      "response",
    ];
    return apiKeywords.some((keyword) => prompt.includes(keyword));
  }

  /**
   * Assess prompt complexity
   */
  private async assessComplexity(
    prompt: string
  ): Promise<"low" | "medium" | "high"> {
    const wordCount = prompt.split(/\s+/).length;
    const hasMultipleTasks = prompt.includes(" and ") || prompt.includes(", ");
    const hasTechnicalTerms =
      /\b(implement|integrate|optimize|refactor|architecture)\b/i.test(prompt);

    if (wordCount > 50 || (hasMultipleTasks && hasTechnicalTerms)) {
      return "high";
    } else if (wordCount > 20 || hasMultipleTasks || hasTechnicalTerms) {
      return "medium";
    }
    return "low";
  }

  /**
   * Detect frameworks mentioned
   */
  private async detectFrameworks(prompt: string): Promise<string[]> {
    const frameworks: string[] = [];
    const frameworkMap = {
      react: "React",
      vue: "Vue",
      angular: "Angular",
      next: "Next.js",
      express: "Express",
      fastapi: "FastAPI",
      django: "Django",
      spring: "Spring",
    };

    for (const [key, value] of Object.entries(frameworkMap)) {
      if (prompt.includes(key)) {
        frameworks.push(value);
      }
    }

    return frameworks;
  }

  /**
   * Save data to Langfuse
   */
  private async saveToLangfuse(data: any): Promise<void> {
    try {
      await mcp__langfuse_prompt__track({
        prompt: data.final,
        metadata: data,
        category: "orchestrated",
        quickScore: data.finalScore,
      });
    } catch (error) {
      console.error("Failed to save to Langfuse:", error);
    }
  }

  /**
   * Apply extracted patterns
   */
  private applyPatterns(patterns: any): void {
    // Store patterns for future use
    // This could update configuration or improve future orchestration
    if (this.config.activation.debug_mode) {
      console.log("📊 Applying patterns:", patterns);
    }
  }

  /**
   * Fallback tracking when orchestration fails
   */
  private async fallbackTracking(prompt: string): Promise<void> {
    try {
      await mcp__langfuse_prompt__track({
        prompt: prompt,
        metadata: {
          fallback: true,
          timestamp: new Date().toISOString(),
        },
        category: "fallback",
      });
    } catch (error) {
      console.error("Fallback tracking also failed:", error);
    }
  }

  /**
   * Get target model for agent type
   */
  private getTargetModel(agentType: string): string {
    const modelMap: { [key: string]: string } = {
      "claude4-opus-prompt-optimizer": "claude",
      "react-prompt-specialist": "claude",
      "api-prompt-expert": "claude",
      "prompt-llm-coordinator": "claude",
    };
    return modelMap[agentType] || "claude";
  }

  /**
   * Get techniques for agent type and context
   */
  private getTechniques(agentType: string, context: Context): string[] {
    const techniques: string[] = ["clarity", "structure"];

    if (context.isReact) {
      techniques.push("component-patterns", "react-best-practices");
    }

    if (context.isAPI) {
      techniques.push("api-design", "error-handling");
    }

    if (context.complexity === "high") {
      techniques.push("chain-of-thought", "step-by-step");
    }

    return techniques;
  }

  /**
   * Simulate a score for testing
   */
  private simulateScore(prompt: string): number {
    // Simple scoring based on prompt characteristics
    let score = 50;

    if (prompt.length > 20) score += 10;
    if (prompt.length > 50) score += 10;
    if (prompt.includes("please") || prompt.includes("help")) score += 5;
    if (/\b(create|implement|build|design)\b/i.test(prompt)) score += 10;
    if (/\b(with|using|including)\b/i.test(prompt)) score += 5;
    if (prompt.includes("?")) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Get current status of orchestrator
   */
  getStatus(): any {
    return {
      active: true,
      config: this.config,
      activeAgents: Array.from(this.activeAgents.keys()),
      historySize: this.promptHistory.length,
      highScoreCount: this.promptHistory.filter(
        (p) => p.score >= this.config.thresholds.high_quality
      ).length,
    };
  }

  /**
   * Clear prompt history
   */
  clearHistory(): void {
    this.promptHistory = [];
    if (this.config.activation.debug_mode) {
      console.log("🐝 Prompt history cleared");
    }
  }
}

// Initialize and export singleton instance
const orchestrator = QueenBeeOrchestrator.getInstance();
export default orchestrator;

// Auto-activation message
console.log("🐝 Queen Bee Orchestrator initialized and ready");
console.log(
  "🐝 Automatic activation:",
  orchestrator.getStatus().config.activation.automatic
);
