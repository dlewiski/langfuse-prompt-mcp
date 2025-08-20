/**
 * Claude Code Integration Hook
 * 
 * This file demonstrates how the Queen Bee Orchestrator would integrate
 * with Claude Code's agent system if the proper hooks were available.
 * 
 * NOTE: This is a conceptual implementation showing what's needed.
 * The actual Claude Code agent system would need to support these APIs.
 */

import orchestrator from './orchestrator/queen-bee-orchestrator.js';
import { createModuleLogger } from './utils/structuredLogger.js';
import type { 
  ClaudeHookMetadata, 
  ClaudeHookConfig
} from './types/refactor.js';
import { 
  BaseError,
  ProcessingError
} from './types/refactor.js';

/**
 * Interface for Claude Code's agent system (hypothetical)
 */
interface AgentParams {
  prompt: string;
  context?: ClaudeHookMetadata;
  config?: ClaudeHookConfig;
  [key: string]: unknown;
}

interface AgentResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

interface IntegrationStatus {
  available: boolean;
  message?: string;
  fallback?: string;
  orchestratorRegistered?: boolean;
  subAgentsCount?: number;
  autoActivation?: boolean;
}

interface ClaudeCodeAgentSystem {
  registerAgent(agent: AgentDefinition): Promise<void>;
  registerPromptHook(hook: PromptHook): Promise<void>;
  spawnSubAgent(type: string, params: AgentParams): Promise<AgentResult>;
  getAgentRegistry(): AgentDefinition[];
}

interface AgentDefinition {
  name: string;
  type: 'orchestrator' | 'evaluator' | 'specialist' | 'tracker';
  proactive: boolean;
  priority: 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
  activation: 'ALWAYS' | 'CONTEXT' | 'MANUAL';
  patterns?: RegExp[];
  handler: (prompt: string, context?: ClaudeHookMetadata) => Promise<AgentResult>;
}

interface PromptHook {
  name: string;
  priority: number;
  intercept: (prompt: string) => Promise<string | null>;
}

/**
 * Mock Claude Code agent system
 * In reality, this would be provided by Claude Code
 */
declare global {
  var ClaudeCode: ClaudeCodeAgentSystem;
}

/**
 * Register the Queen Bee Orchestrator with Claude Code
 * This is what SHOULD happen when the MCP server starts
 */
export async function registerQueenBeeOrchestrator(): Promise<void> {
  const logger = createModuleLogger('ClaudeCodeHook');
  
  if (typeof globalThis.ClaudeCode === 'undefined') {
    logger.warn('⚠️ Claude Code agent system not available');
    logger.warn('⚠️ Orchestrator will only work via manual tool invocation');
    return;
  }

  try {
    // 1. Register the main orchestrator as a proactive agent
    await globalThis.ClaudeCode.registerAgent({
      name: 'prompt-manager',
      type: 'orchestrator',
      proactive: true,
      priority: 'HIGHEST',
      activation: 'ALWAYS',
      patterns: [/.*/], // Match ALL prompts
      handler: async (prompt: string, _context?: ClaudeHookMetadata): Promise<AgentResult> => {
        logger.info('🐝 Queen Bee Orchestrator intercepted prompt');
        
        // Run orchestration
        const result = await orchestrator.orchestrate(prompt);
        
        // Return enhanced prompt to Claude Code
        return {
          success: true,
          data: {
            originalPrompt: prompt,
            enhancedPrompt: result.finalPrompt,
            metadata: {
              orchestrated: true,
              score: result.finalScore,
              improved: result.improved,
              context: result.context
            }
          }
        };
      }
    });

    // 2. Register sub-agents that can be spawned
    const subAgents: AgentDefinition[] = [
      {
        name: 'prompt-auto-tracker',
        type: 'tracker',
        proactive: false,
        priority: 'HIGH',
        activation: 'MANUAL',
        handler: async (prompt: string, params: any) => {
          // Track to Langfuse
          return await trackPrompt(prompt, params);
        }
      },
      {
        name: 'prompt-evaluation-judge',
        type: 'evaluator',
        proactive: false,
        priority: 'HIGH',
        activation: 'MANUAL',
        handler: async (prompt: string, params: any) => {
          // Evaluate prompt quality
          return await evaluatePrompt(prompt, params);
        }
      },
      {
        name: 'react-prompt-specialist',
        type: 'specialist',
        proactive: false,
        priority: 'HIGH',
        activation: 'CONTEXT',
        patterns: [/react|component|jsx|tsx|hook/i],
        handler: async (prompt: string, params: any) => {
          // React-specific improvements
          return await improveReactPrompt(prompt, params);
        }
      },
      {
        name: 'api-prompt-expert',
        type: 'specialist',
        proactive: false,
        priority: 'HIGH',
        activation: 'CONTEXT',
        patterns: [/api|endpoint|rest|graphql|backend/i],
        handler: async (prompt: string, params: any) => {
          // API-specific improvements
          return await improveAPIPrompt(prompt, params);
        }
      },
      {
        name: 'claude4-opus-prompt-optimizer',
        type: 'specialist',
        proactive: false,
        priority: 'HIGH',
        activation: 'MANUAL',
        handler: async (prompt: string, params: any) => {
          // General Claude 4 optimizations
          return await optimizeForClaude4(prompt, params);
        }
      },
      {
        name: 'prompt-pattern-extractor',
        type: 'evaluator',
        proactive: false,
        priority: 'MEDIUM',
        activation: 'MANUAL',
        handler: async (prompt: string, params: any) => {
          // Extract patterns from high-scoring prompts
          // Note: This agent actually needs multiple prompts, so we'll handle that in params
          const prompts = params?.prompts || [prompt];
          return await extractPatterns(prompts, params);
        }
      }
    ];

    // Register all sub-agents
    for (const agent of subAgents) {
      await globalThis.ClaudeCode.registerAgent(agent);
      logger.info(`✅ Registered sub-agent: ${agent.name}`);
    }

    // 3. Register prompt interception hook
    await globalThis.ClaudeCode.registerPromptHook({
      name: 'queen-bee-interceptor',
      priority: 1000, // Highest priority
      intercept: async (prompt: string) => {
        // Check if orchestration is enabled
        if (process.env.DISABLE_PROMPT_ORCHESTRATOR === 'true') {
          return null; // Don't intercept
        }

        // Check for bypass patterns
        if (prompt.startsWith('/raw ') || prompt.includes('--no-orchestrate')) {
          return null; // Don't intercept
        }

        // Orchestrate the prompt
        const result = await orchestrator.orchestrate(prompt);
        
        // Return enhanced prompt
        return result.finalPrompt;
      }
    });

    logger.info('✅ Queen Bee Orchestrator registered with Claude Code');
    logger.info('🐝 Auto-activation enabled for ALL prompts');
    
  } catch (error) {
    logger.error('❌ Failed to register orchestrator with Claude Code', error);
    if (error instanceof BaseError) {
      throw error;
    }
    throw new ProcessingError(
      `Failed to register orchestrator: ${error instanceof Error ? error.message : String(error)}`,
      { originalError: error }
    );
  }
}

/**
 * Helper function to spawn sub-agents
 * This would use Claude Code's Task tool in reality
 */
export async function spawnSubAgent(type: string, params: AgentParams): Promise<AgentResult> {
  if (globalThis.ClaudeCode?.spawnSubAgent) {
    // Use Claude Code's native spawning
    return await globalThis.ClaudeCode.spawnSubAgent(type, params);
  } else {
    // Fallback to direct execution
    const logger = createModuleLogger('ClaudeCodeHook');
    logger.warn(`⚠️ Direct execution of ${type} (Claude Code spawning not available)`);
    
    // Simulate agent execution
    switch (type) {
      case 'prompt-auto-tracker':
        return await trackPrompt(params.prompt, params);
      case 'prompt-evaluation-judge':
        return await evaluatePrompt(params.prompt, params);
      case 'react-prompt-specialist':
        return await improveReactPrompt(params.prompt, params);
      case 'api-prompt-expert':
        return await improveAPIPrompt(params.prompt, params);
      case 'claude4-opus-prompt-optimizer':
        return await optimizeForClaude4(params.prompt, params);
      case 'prompt-pattern-extractor':
        return await extractPatterns(params.prompt, params);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}

// Agent implementation functions (simplified)
async function trackPrompt(_prompt: string, _params: any): Promise<any> {
  // Implementation would use mcp__langfuse_prompt__track
  return { tracked: true, id: 'track-' + Date.now() };
}

async function evaluatePrompt(_prompt: string, _params: any): Promise<any> {
  // Implementation would use mcp__langfuse_prompt__evaluate
  return { score: 75, details: {} };
}

async function improveReactPrompt(prompt: string, _params: any): Promise<any> {
  // React-specific improvements
  return { 
    prompt: prompt + ' [React optimized]',
    improvements: ['Added TypeScript', 'Added hooks', 'Added accessibility']
  };
}

async function improveAPIPrompt(prompt: string, _params: any): Promise<any> {
  // API-specific improvements
  return {
    prompt: prompt + ' [API optimized]',
    improvements: ['Added error handling', 'Added validation', 'Added auth']
  };
}

async function optimizeForClaude4(prompt: string, _params: any): Promise<any> {
  // Claude 4 specific optimizations
  return {
    prompt: prompt + ' [Claude 4 optimized]',
    improvements: ['Added chain of thought', 'Added examples', 'Added structure']
  };
}

async function extractPatterns(_prompt: string, _params: any): Promise<any> {
  // Pattern extraction logic
  return {
    patterns: ['Use TypeScript', 'Include error handling', 'Add tests'],
    confidence: 0.85
  };
}

/**
 * Check if Claude Code integration is available
 */
export function isClaudeCodeAvailable(): boolean {
  return typeof globalThis.ClaudeCode !== 'undefined';
}

/**
 * Get integration status
 */
export function getIntegrationStatus(): IntegrationStatus {
  if (!isClaudeCodeAvailable()) {
    return {
      available: false,
      message: 'Claude Code agent system not available',
      fallback: 'Use manual tool invocation: mcp__langfuse_prompt__orchestrate_prompt'
    };
  }

  const registry = globalThis.ClaudeCode.getAgentRegistry();
  const orchestratorRegistered = registry.some(a => a.name === 'prompt-manager');
  
  return {
    available: true,
    orchestratorRegistered,
    subAgentsCount: registry.filter(a => a.type !== 'orchestrator').length,
    autoActivation: orchestratorRegistered && registry.find(a => a.name === 'prompt-manager')?.activation === 'ALWAYS'
  };
}

// Auto-register on import if Claude Code is available
if (isClaudeCodeAvailable()) {
  const logger = createModuleLogger('ClaudeCodeHook');
  registerQueenBeeOrchestrator().catch((error) => logger.error('Registration failed', error));
} else {
  const logger = createModuleLogger('ClaudeCodeHook');
  logger.info('📝 Claude Code integration not available');
  logger.info('📝 Use manual orchestration: mcp__langfuse_prompt__orchestrate_prompt({ prompt: "..." })');
}