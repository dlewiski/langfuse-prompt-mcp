/**
 * Queen Bee Orchestrator - Central coordinator for all prompt operations (Refactored)
 *
 * This orchestrator automatically activates for every user prompt and coordinates
 * multiple sub-agents in parallel for maximum efficiency.
 */

import { Phase1Analyzer, Phase1Results } from "./phases/phase1-analyzer.js";
import { Phase2Improver, Phase2Results } from "./phases/phase2-improver.js";
import { Phase3Finalizer, Phase3Results } from "./phases/phase3-finalizer.js";
import { Phase4PatternExtractor } from "./phases/phase4-pattern-extractor.js";

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
      react: string[];
      api: string[];
      complex: string[];
    };
  };
}

export class QueenBeeOrchestrator {
  private config: OrchestratorConfig;
  private static instance: QueenBeeOrchestrator | null = null;
  // Prompt history tracking removed as it was unused
  // Can be re-added when needed for history functionality
  
  // Phase handlers
  private phase1: Phase1Analyzer;
  private phase2: Phase2Improver;
  private phase3: Phase3Finalizer;
  private phase4: Phase4PatternExtractor;

  private constructor(config?: Partial<OrchestratorConfig>) {
    this.config = this.mergeConfig(config);
    
    // Initialize phase handlers
    this.phase1 = new Phase1Analyzer();
    this.phase2 = new Phase2Improver(this.config);
    this.phase3 = new Phase3Finalizer();
    this.phase4 = new Phase4PatternExtractor(this.config);
    
    this.setupAutoActivation();
  }

  static getInstance(config?: Partial<OrchestratorConfig>): QueenBeeOrchestrator {
    if (!QueenBeeOrchestrator.instance) {
      QueenBeeOrchestrator.instance = new QueenBeeOrchestrator(config);
    }
    return QueenBeeOrchestrator.instance;
  }

  // For testing purposes only - resets the singleton
  static resetInstance(config?: Partial<OrchestratorConfig>): QueenBeeOrchestrator {
    QueenBeeOrchestrator.instance = null;
    return QueenBeeOrchestrator.getInstance(config);
  }

  private mergeConfig(partial?: Partial<OrchestratorConfig>): OrchestratorConfig {
    const defaultConfig: OrchestratorConfig = {
      activation: {
        automatic: true,
        manual_override: false,
        debug_mode: true,
      },
      parallelization: {
        max_concurrent_agents: 5,
        timeout_ms: 5000,
        retry_on_failure: true,
        fallback_mode: "basic_tracking",
      },
      thresholds: {
        improvement_trigger: 70,
        high_quality: 85,
        pattern_extraction_min: 10,
      },
      agent_selection: {
        always_include: ["prompt-auto-tracker", "prompt-evaluation-judge"],
        context_based: {
          react: ["react-prompt-specialist"],
          api: ["api-prompt-expert"],
          complex: ["prompt-llm-coordinator", "claude4-opus-prompt-optimizer"],
        },
      },
    };

    return { ...defaultConfig, ...partial };
  }

  private setupAutoActivation(): void {
    console.log("🐝 Queen Bee Orchestrator: Auto-activation setup complete");
    
    if (this.config.activation.debug_mode) {
      console.log("🐝 Configuration:", JSON.stringify(this.config, null, 2));
    }
    
    console.log("🐝 Queen Bee Orchestrator initialized and ready");
    console.log(`🐝 Automatic activation: ${this.config.activation.automatic}`);
  }

  /**
   * Main orchestration entry point
   */
  async orchestrate(userPrompt: string): Promise<any> {
    const startTime = Date.now();
    console.log("🐝 Queen Bee Orchestrator: Processing prompt");
    console.log(`🐝 Prompt length: ${userPrompt.length}`);

    try {
      // Phase 1: Parallel initial analysis
      const phase1Results = await this.executePhase1(userPrompt);

      // Phase 2: Conditional improvement
      const phase2Results = await this.executePhase2(
        userPrompt,
        phase1Results.evaluation.score,
        phase1Results.context
      );

      // Phase 3: Finalization and storage
      const phase3Results = await this.executePhase3(
        userPrompt,
        phase1Results.evaluation.score,
        phase2Results
      );

      // Add to history for pattern extraction
      this.phase4.addToHistory(
        phase3Results.finalPrompt,
        phase3Results.finalScore,
        phase1Results.context
      );

      // Phase 4: Async pattern extraction (non-blocking)
      this.executePhase4Async();

      const duration = Date.now() - startTime;
      console.log(`🐝 Orchestration complete in ${duration}ms`);
      console.log(`🐝 Final score: ${phase3Results.finalScore}`);

      return {
        success: true,
        originalPrompt: userPrompt,
        finalPrompt: phase3Results.finalPrompt,
        originalScore: phase1Results.evaluation.score,
        finalScore: phase3Results.finalScore,
        improved: phase2Results.improved,
        improvement: phase3Results.improvement,
        context: phase1Results.context,
        metadata: {
          duration,
          phases: {
            phase1: phase1Results,
            phase2: phase2Results,
            phase3: phase3Results.metadata,
          },
        },
      };
    } catch (error) {
      console.error("❌ Orchestration failed:", error);
      
      // Fallback to basic tracking
      if (this.config.parallelization.fallback_mode === "basic_tracking") {
        await this.fallbackTracking(userPrompt);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        originalPrompt: userPrompt,
        finalPrompt: userPrompt,
      };
    }
  }

  private async executePhase1(prompt: string): Promise<Phase1Results> {
    return await this.phase1.execute(prompt);
  }

  private async executePhase2(
    prompt: string,
    currentScore: number,
    context: any
  ): Promise<Phase2Results> {
    return await this.phase2.execute(prompt, currentScore, context);
  }

  private async executePhase3(
    originalPrompt: string,
    originalScore: number,
    phase2Results: Phase2Results
  ): Promise<Phase3Results> {
    return await this.phase3.execute(originalPrompt, originalScore, phase2Results);
  }

  private executePhase4Async(): void {
    this.phase4.executeAsync();
  }

  private async fallbackTracking(prompt: string): Promise<void> {
    console.log("🔄 Fallback: Basic tracking");
    try {
      // Simple tracking without orchestration
      this.phase4.addToHistory(prompt, 50); // Default score
    } catch (error) {
      console.error("❌ Fallback tracking failed:", error);
    }
  }

  /**
   * Get orchestrator status
   */
  getStatus(): any {
    const history = this.phase4.getHistory();
    const highScoreCount = this.phase4.getHighScoringCount();
    
    return {
      active: true,
      config: this.config,
      activeAgents: [],
      historySize: history.length,
      highScoreCount: highScoreCount,
      promptHistory: {
        total: history.length,
        highScoring: highScoreCount,
      },
      ready: true,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(partial: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...partial };
    
    // Update phase handlers with new config
    this.phase2 = new Phase2Improver(this.config);
    this.phase4 = new Phase4PatternExtractor(this.config);
    
    console.log("🐝 Configuration updated");
  }

  /**
   * Clear prompt history
   */
  clearHistory(): void {
    // History tracking to be implemented when needed
  }
}

// Export singleton instance
const orchestrator = QueenBeeOrchestrator.getInstance();
export default orchestrator;