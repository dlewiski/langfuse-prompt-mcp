/**
 * Patterns Handler
 * Extracts patterns from high-scoring prompts in Langfuse
 */

import { PatternsSchema, type PatternsInput } from '../tools/schemas.js';
import { extractPatterns } from '../patterns/extractor.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import type { 
  PatternAnalysisResult,
  ExtractedPattern 
} from '../types/domain.js';
import type { MCPRequestContext } from '../types/mcp.js';

/**
 * Handle patterns extraction requests
 */
export async function handlePatterns(
  args: unknown,
  _context?: MCPRequestContext
): Promise<ReturnType<typeof successResponse | typeof errorResponse>> {
  try {
    // Validate input with defaults
    const { minScore = 85, limit = 100 }: PatternsInput = PatternsSchema.parse(args || {});
    
    handlerLogger.info(`Extracting patterns from prompts with score >= ${minScore}, limit: ${limit}`);
    
    // Extract patterns from high-scoring prompts
    const result = await extractPatterns(minScore, limit);
    
    // Format and return results
    const response: PatternAnalysisResult = {
      patterns: result.patterns,
      totalPromptsAnalyzed: result.totalPromptsAnalyzed,
      averageScore: result.averageScore,
      topPatterns: result.patterns.slice(0, 5), // Top 5 patterns
      recommendations: generateRecommendations(result.patterns),
    };
    
    return successResponse(response);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    handlerLogger.error('Error in handlePatterns:', errorMessage);
    
    return errorResponse('Failed to extract patterns', {
      message: errorMessage,
      suggestion: 'Ensure Langfuse is configured and contains tracked prompts',
    });
  }
}

/**
 * Generate recommendations based on extracted patterns
 */
function generateRecommendations(patterns: ExtractedPattern[]): string[] {
  const recommendations: string[] = [];
  
  // Group patterns by category
  const patternsByCategory = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.category]) {
      acc[pattern.category] = [];
    }
    acc[pattern.category].push(pattern);
    return acc;
  }, {} as Record<string, ExtractedPattern[]>);
  
  // Generate category-specific recommendations
  if (patternsByCategory.structure?.length > 0) {
    const topStructure = patternsByCategory.structure[0];
    recommendations.push(
      `Use ${topStructure.name} structure for better organization (${topStructure.frequency} occurrences)`
    );
  }
  
  if (patternsByCategory.instruction?.length > 0) {
    const topInstruction = patternsByCategory.instruction[0];
    recommendations.push(
      `Include ${topInstruction.name} for clearer instructions (impact: ${topInstruction.impact})`
    );
  }
  
  if (patternsByCategory.example?.length > 0) {
    recommendations.push(
      'Provide concrete examples - high-scoring prompts average 2-3 examples'
    );
  }
  
  if (patternsByCategory.reasoning?.length > 0) {
    recommendations.push(
      'Implement chain-of-thought reasoning for complex tasks'
    );
  }
  
  if (patternsByCategory['error-handling']?.length > 0) {
    recommendations.push(
      'Include error handling instructions and edge cases'
    );
  }
  
  // Add high-impact pattern recommendations
  const highImpactPatterns = patterns
    .filter(p => p.impact === 'high')
    .slice(0, 3);
  
  for (const pattern of highImpactPatterns) {
    if (!recommendations.some(r => r.includes(pattern.name))) {
      recommendations.push(
        `Apply "${pattern.name}" pattern for ${pattern.category} improvement`
      );
    }
  }
  
  // Limit recommendations
  return recommendations.slice(0, 10);
}

/**
 * Export handler metadata
 */
export const patternsHandlerMetadata = {
  name: 'patterns',
  description: 'Extract patterns from high-scoring prompts',
  inputSchema: PatternsSchema,
  requiresLangfuse: true,
  features: [
    'pattern-extraction',
    'frequency-analysis',
    'category-grouping',
    'impact-assessment',
    'recommendation-generation',
  ] as const,
} as const;