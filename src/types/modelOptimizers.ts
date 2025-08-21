/**
 * Model Optimizer Type Definitions
 * Types for model-specific optimization options
 */

/**
 * Base options for all model optimizers
 */
export interface BaseOptimizerOptions {
  /** Model name or identifier */
  model?: string;
  /** Provider name */
  provider?: string;
  /** Engine or runtime */
  engine?: string;
  /** Complexity level */
  complexity?: 'low' | 'medium' | 'high';
  /** Target context window size */
  maxTokens?: number;
  /** Custom temperature setting */
  temperature?: number;
}

/**
 * Claude-specific optimizer options
 */
export interface ClaudeOptimizerOptions extends BaseOptimizerOptions {
  /** Enable prefilling optimization */
  enablePrefilling?: boolean;
  /** Generate artifacts for code/data */
  generateArtifacts?: boolean;
  /** Use thinking tags for complex reasoning */
  useThinkingTags?: boolean;
  /** Enable constitutional AI alignment */
  enableConstitutional?: boolean;
}

/**
 * GPT-specific optimizer options
 */
export interface GPTOptimizerOptions extends BaseOptimizerOptions {
  /** Use structured output format */
  structuredOutput?: boolean;
  /** Include few-shot examples */
  includeFewShot?: boolean;
  /** Enable function calling */
  enableFunctions?: boolean;
  /** Use system message optimization */
  optimizeSystemMessage?: boolean;
  /** JSON mode configuration */
  jsonMode?: boolean;
}

/**
 * Gemini-specific optimizer options
 */
export interface GeminiOptimizerOptions extends BaseOptimizerOptions {
  /** Enable grounding with Google Search */
  enableGrounding?: boolean;
  /** Use context caching for long prompts */
  useContextCaching?: boolean;
  /** Enable multi-modal inputs */
  multiModal?: boolean;
  /** Enable multi-turn conversation */
  multiTurn?: boolean;
  /** Safety settings level */
  safetyLevel?: 'BLOCK_NONE' | 'BLOCK_LOW' | 'BLOCK_MEDIUM' | 'BLOCK_HIGH';
}

/**
 * Universal optimizer options (works with any model)
 */
export interface UniversalOptimizerOptions extends BaseOptimizerOptions {
  /** Target output format */
  outputFormat?: 'text' | 'json' | 'xml' | 'markdown';
  /** Include chain of thought */
  includeReasoning?: boolean;
  /** Add examples */
  includeExamples?: boolean;
  /** Error handling instructions */
  includeErrorHandling?: boolean;
}

/**
 * Combined optimizer options type
 */
export type OptimizerOptions = 
  | ClaudeOptimizerOptions
  | GPTOptimizerOptions
  | GeminiOptimizerOptions
  | UniversalOptimizerOptions;

/**
 * Model optimizer result
 */
export interface OptimizerResult {
  /** Optimized prompt text */
  optimizedPrompt: string;
  /** List of optimizations applied */
  optimizations: string[];
  /** Model-specific metadata */
  metadata?: Record<string, any>;
  /** Estimated token count */
  estimatedTokens?: number;
  /** Model-specific recommendations */
  recommendations?: string[];
}

/**
 * Model features interface with common and model-specific properties
 */
export interface ModelFeatures {
  /** Common features */
  supportsMarkdown?: boolean;
  supportsJSON?: boolean;
  preferredStructure?: 'xml' | 'json' | 'markdown';
  maxContextWindow?: number;
  
  /** Claude-specific features */
  supportsXML?: boolean;
  supportsPrefilling?: boolean;
  supportsThinkingTags?: boolean;
  
  /** GPT-specific features */
  supportsSystemMessage?: boolean;
  supportsFunctionCalling?: boolean;
  supportsResponseFormat?: boolean;
  
  /** Gemini-specific features */
  supportsGrounding?: boolean;
  supportsContextCaching?: boolean;
  supportsSafetySettings?: boolean;
  
  /** Other potential features */
  [key: string]: any;
}

/**
 * Model detection result
 */
export interface ModelDetectionResult {
  /** Detected model type */
  model: 'claude' | 'gpt' | 'gemini' | 'generic' | 'unknown';
  /** Confidence score (0-1) */
  confidence: number;
  /** Provider if detected */
  provider?: string;
  /** Version if detected */
  version?: string;
  /** Detection signals found */
  signals: string[];
  /** Model features */
  features?: ModelFeatures;
}