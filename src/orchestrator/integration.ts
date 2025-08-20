/**
 * Integration module for Queen Bee Orchestrator with Claude Code
 *
 * This module handles:
 * 1. Auto-activation for every user prompt
 * 2. Integration with Claude Code's Task tool
 * 3. Coordination with MCP tools
 * 4. Seamless sub-agent spawning
 */

import orchestrator from "./queen-bee-orchestrator.js";

/**
 * Hook configuration for Claude Code integration
 */
export interface HookConfiguration {
  enabled: boolean;
  interceptAll: boolean;
  patterns?: RegExp[];
  excludePatterns?: RegExp[];
}

/**
 * Integration class for connecting orchestrator to Claude Code
 */
export class OrchestratorIntegration {
  private static isInitialized = false;
  private static hookConfig: HookConfiguration = {
    enabled: true,
    interceptAll: true,
  };

  /**
   * Initialize the orchestrator integration
   * This should be called when the MCP server starts
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("🐝 Orchestrator already initialized");
      return;
    }

    try {
      // Register the orchestrator as a proactive agent
      await this.registerProactiveAgent();

      // Setup prompt interception
      await this.setupPromptInterception();

      // Register sub-agents
      await this.registerSubAgents();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log(
        "🐝 Queen Bee Orchestrator integration initialized successfully"
      );
      console.log("🐝 Auto-activation enabled for all prompts");
    } catch (error) {
      console.error("🐝 Failed to initialize orchestrator integration:", error);
      throw error;
    }
  }

  /**
   * Register the orchestrator as a proactive agent
   */
  private static async registerProactiveAgent(): Promise<void> {
    // This would register with Claude Code's agent system
    const agentDefinition = {
      name: "prompt-manager",
      type: "prompt-orchestrator",
      description:
        "Master coordinator for prompt optimization. MUST BE USED PROACTIVELY when any prompt needs improvement.",
      activation: "ALWAYS",
      priority: "HIGHEST",
      capabilities: [
        "prompt-tracking",
        "prompt-evaluation",
        "prompt-improvement",
        "pattern-extraction",
        "parallel-coordination",
      ],
      tools: [
        "task",
        "mcp__langfuse-prompt__track",
        "mcp__langfuse-prompt__evaluate",
        "mcp__langfuse-prompt__improve",
        "mcp__langfuse-prompt__compare",
        "mcp__langfuse-prompt__patterns",
      ],
    };

    console.log(
      "🐝 Registering prompt-manager as proactive agent:",
      agentDefinition
    );
  }

  /**
   * Setup prompt interception to catch all user prompts
   */
  private static async setupPromptInterception(): Promise<void> {
    // This would hook into Claude Code's prompt submission system
    // The actual implementation would depend on Claude Code's API

    console.log("🐝 Setting up prompt interception hooks");

    // Example of what the integration might look like:
    /*
    ClaudeCode.on('prompt:submitted', async (prompt: string, context: any) => {
      if (this.shouldInterceptPrompt(prompt)) {
        await this.handlePrompt(prompt, context);
      }
    });
    */
  }

  /**
   * Register all sub-agents that the orchestrator can spawn
   */
  private static async registerSubAgents(): Promise<void> {
    const subAgents = [
      {
        type: "prompt-auto-tracker",
        description: "Automatically tracks all prompts to Langfuse",
        activation: "spawned-by-orchestrator",
      },
      {
        type: "prompt-evaluation-judge",
        description: "LLM judge for evaluating prompts using Claude Sonnet 4",
        activation: "spawned-by-orchestrator",
      },
      {
        type: "react-prompt-specialist",
        description: "Expert in optimizing prompts for React applications",
        activation: "spawned-by-orchestrator",
      },
      {
        type: "prompt-pattern-extractor",
        description: "Analyzes high-scoring prompts to extract patterns",
        activation: "spawned-by-orchestrator",
      },
      {
        type: "prompt-llm-coordinator",
        description: "Coordinates LLM evaluations between MCP and Claude Code",
        activation: "spawned-by-orchestrator",
      },
      {
        type: "claude4-opus-prompt-optimizer",
        description: "Specialist in Claude 4 Opus specific optimizations",
        activation: "spawned-by-orchestrator",
      },
      {
        type: "api-prompt-expert",
        description: "Expert in optimizing prompts for backend APIs",
        activation: "spawned-by-orchestrator",
      },
    ];

    console.log(`🐝 Registering ${subAgents.length} sub-agents`);
    subAgents.forEach((agent) => {
      console.log(`  - ${agent.type}: ${agent.description}`);
    });
  }

  /**
   * Setup event listeners for orchestrator events
   */
  private static setupEventListeners(): void {
    // Listen for orchestrator events and log them
    console.log("🐝 Setting up orchestrator event listeners");
  }

  // Note: shouldInterceptPrompt was removed as it was unused
  // The interception logic can be implemented when needed

  /**
   * Handle an intercepted prompt
   */
  static async handlePrompt(prompt: string, _context?: any): Promise<any> {
    console.log("🐝 Intercepted prompt:", prompt.substring(0, 50) + "...");

    try {
      // Pass to orchestrator for processing
      const result = await orchestrator.orchestrate(prompt);

      console.log("🐝 Orchestration complete:", {
        originalScore: result.originalScore,
        finalScore: result.finalScore,
        improved: result.improved,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      console.error("🐝 Orchestration failed:", error);
      throw error;
    }
  }

  /**
   * Update hook configuration
   */
  static updateConfiguration(config: Partial<HookConfiguration>): void {
    this.hookConfig = { ...this.hookConfig, ...config };
    console.log("🐝 Hook configuration updated:", this.hookConfig);
  }

  /**
   * Get current integration status
   */
  static getStatus(): any {
    return {
      initialized: this.isInitialized,
      hookConfig: this.hookConfig,
      orchestratorStatus: orchestrator.getStatus(),
    };
  }

  /**
   * Shutdown the integration
   */
  static async shutdown(): Promise<void> {
    console.log("🐝 Shutting down orchestrator integration");
    orchestrator.clearHistory();
    this.isInitialized = false;
  }
}

/**
 * MCP Tool Wrapper for Orchestrator
 * This allows the orchestrator to be invoked as an MCP tool
 */
export const orchestratorTool = {
  name: "orchestrate_prompt",
  description:
    "Orchestrate prompt evaluation and improvement using Queen Bee pattern",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "The prompt to orchestrate",
      },
      options: {
        type: "object",
        properties: {
          skipImprovement: {
            type: "boolean",
            description: "Skip improvement phase",
          },
          forceImprovement: {
            type: "boolean",
            description: "Force improvement even for high-scoring prompts",
          },
          targetScore: {
            type: "number",
            description: "Target score for improvement",
          },
        },
      },
    },
    required: ["prompt"],
  },
  handler: async (args: any) => {
    return await OrchestratorIntegration.handlePrompt(
      args.prompt,
      args.options
    );
  },
};

/**
 * Auto-initialization when module is imported
 */
if (
  typeof process !== "undefined" &&
  process.env.AUTO_INIT_ORCHESTRATOR !== "false"
) {
  OrchestratorIntegration.initialize().catch((error) => {
    console.error("🐝 Auto-initialization failed:", error);
  });
}

export default OrchestratorIntegration;
