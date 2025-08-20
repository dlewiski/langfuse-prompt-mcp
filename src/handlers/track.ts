/**
 * Track Handler
 * Records prompts to Langfuse with metadata and scoring
 * @module handlers/track
 */

import { langfuse } from '../config/index.js';
import { TrackSchema, type TrackInput } from '../tools/schemas.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import type { 
  PromptMetadata 
} from '../types/domain.js';
import type { 
  LangfuseClient
} from '../types/langfuse.js';
import type { MCPRequestContext } from '../types/mcp.js';

/**
 * Cache for word count calculation
 */
const wordCountCache = new Map<string, number>();
const MAX_CACHE_SIZE = 100;

/**
 * Category detection patterns
 */
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'code-generation': [
    /\b(write|create|generate|implement)\s+.*\b(code|function|class|component)\b/i,
    /\b(python|javascript|typescript|java|c\+\+|golang)\b/i,
  ],
  'data-analysis': [
    /\b(analyze|process|transform|aggregate)\s+.*\bdata\b/i,
    /\b(dataframe|dataset|sql|query|statistics)\b/i,
  ],
  'documentation': [
    /\b(document|explain|describe|write)\s+.*\b(guide|readme|docs)\b/i,
    /\b(api|documentation|tutorial|reference)\b/i,
  ],
  'testing': [
    /\b(test|validate|verify|check)\s+/i,
    /\b(unit test|integration test|e2e|testing)\b/i,
  ],
  'refactoring': [
    /\b(refactor|improve|optimize|clean)\s+.*\bcode\b/i,
    /\b(performance|optimization|cleanup)\b/i,
  ],
};

/**
 * Track response structure
 */
interface TrackResponse {
  tracked: boolean;
  traceId?: string;
  category: string;
  wordCount: number;
  complexity?: string;
  score?: number;
  reason?: string;
}

/**
 * Calculate word count with caching
 */
function getWordCount(text: string): number {
  // Use cached value if available
  if (wordCountCache.has(text)) {
    return wordCountCache.get(text)!;
  }
  
  // Calculate and cache
  const count = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
  
  // Limit cache size to prevent memory issues
  if (wordCountCache.size >= MAX_CACHE_SIZE) {
    const firstKey = wordCountCache.keys().next().value;
    if (firstKey) {
      wordCountCache.delete(firstKey);
    }
  }
  
  wordCountCache.set(text, count);
  return count;
}

/**
 * Detect prompt category based on content
 */
function detectCategory(prompt: string): string {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(prompt))) {
      return category;
    }
  }
  return 'general';
}

/**
 * Detect prompt complexity based on various factors
 */
function detectComplexity(prompt: string, wordCount: number): 'low' | 'medium' | 'high' {
  // Complexity factors
  const hasMultipleSteps = /\b(then|after|next|finally|subsequently)\b/i.test(prompt);
  const hasConditionals = /\b(if|when|unless|otherwise|except)\b/i.test(prompt);
  const hasCode = /```[\s\S]*```/.test(prompt) || /\b(function|class|def|const|let|var)\b/.test(prompt);
  const hasTechnicalTerms = /\b(api|database|algorithm|architecture|framework)\b/i.test(prompt);
  
  let complexityScore = 0;
  
  // Word count factor
  if (wordCount > 200) complexityScore += 2;
  else if (wordCount > 100) complexityScore += 1;
  
  // Content factors
  if (hasMultipleSteps) complexityScore += 1;
  if (hasConditionals) complexityScore += 1;
  if (hasCode) complexityScore += 2;
  if (hasTechnicalTerms) complexityScore += 1;
  
  // Determine complexity level
  if (complexityScore >= 5) return 'high';
  if (complexityScore >= 3) return 'medium';
  return 'low';
}

/**
 * Extract frameworks from prompt
 */
function detectFrameworks(prompt: string): string[] {
  const frameworks: string[] = [];
  const frameworkPatterns: Record<string, RegExp> = {
    'react': /\breact\b/i,
    'vue': /\bvue\b/i,
    'angular': /\bangular\b/i,
    'express': /\bexpress\b/i,
    'django': /\bdjango\b/i,
    'flask': /\bflask\b/i,
    'spring': /\bspring\b/i,
    'rails': /\brails\b/i,
    'nextjs': /\bnext\.?js\b/i,
    'nuxt': /\bnuxt\b/i,
    'fastapi': /\bfastapi\b/i,
    'tensorflow': /\btensorflow\b/i,
    'pytorch': /\bpytorch\b/i,
  };
  
  for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
    if (pattern.test(prompt)) {
      frameworks.push(framework);
    }
  }
  
  return frameworks;
}

/**
 * Handle prompt tracking requests
 */
export async function handleTrack(
  args: unknown,
  context?: MCPRequestContext
): Promise<ReturnType<typeof successResponse | typeof errorResponse>> {
  try {
    // Validate input
    const validated: TrackInput = TrackSchema.parse(args);
    const { prompt, category, metadata, quickScore } = validated;
    
    // Calculate metrics
    const wordCount = getWordCount(prompt);
    const detectedCategory = category || detectCategory(prompt);
    const complexity = metadata?.complexity || detectComplexity(prompt, wordCount);
    const frameworks = metadata?.frameworks || detectFrameworks(prompt);
    const hasCode = metadata?.hasCode ?? /```[\s\S]*```/.test(prompt);
    
    // Prepare enhanced metadata
    const enhancedMetadata: PromptMetadata = {
      ...metadata,
      wordCount: metadata?.wordCount || wordCount,
      complexity,
      hasCode,
      frameworks: frameworks.length > 0 ? frameworks : undefined,
      category: detectedCategory,
      timestamp: new Date().toISOString(),
      ...context?.metadata,
    };
    
    // Check if Langfuse is configured
    if (!langfuse) {
      handlerLogger.warn('Langfuse not configured, skipping tracking');
      
      const response: TrackResponse = {
        tracked: false,
        reason: 'Langfuse not configured',
        category: detectedCategory,
        wordCount,
        complexity,
      };
      
      return successResponse(response);
    }
    
    // Create Langfuse trace
    const trace = (langfuse as LangfuseClient).trace({
      name: 'prompt-tracking',
      metadata: enhancedMetadata,
      userId: context?.userId,
      sessionId: context?.sessionId,
      input: prompt,
      tags: [
        detectedCategory,
        `complexity:${complexity}`,
        ...(frameworks.length > 0 ? frameworks.map(f => `framework:${f}`) : []),
        ...(hasCode ? ['has-code'] : []),
      ],
    });
    
    // Add score if provided
    if (quickScore !== undefined) {
      await trace.score({
        name: 'quick-score',
        value: quickScore,
        dataType: 'NUMERIC',
        comment: 'User-provided quick score',
      });
    }
    
    // Flush to ensure data is sent
    await (langfuse as LangfuseClient).flush();
    
    handlerLogger.info(`Tracked prompt with ID: ${trace.id}`);
    
    const response: TrackResponse = {
      tracked: true,
      traceId: trace.id,
      category: detectedCategory,
      wordCount,
      complexity,
      score: quickScore,
    };
    
    return successResponse(response);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    handlerLogger.error('Error in handleTrack:', errorMessage);
    
    return errorResponse('Failed to track prompt', {
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}

/**
 * Export handler metadata for testing and documentation
 */
export const trackHandlerMetadata = {
  name: 'track',
  description: 'Track prompts to Langfuse with metadata and scoring',
  inputSchema: TrackSchema,
  requiresLangfuse: true,
  features: [
    'automatic-categorization',
    'complexity-detection',
    'framework-detection',
    'word-count-caching',
    'metadata-enrichment',
  ] as const,
} as const;