/**
 * Track handler for recording prompts to Langfuse
 * @module handlers/track
 */

import { langfuse } from '../config.js';
import { z } from 'zod';

/**
 * Schema for track request validation
 */
const TrackSchema = z.object({
  prompt: z.string().min(1).max(10000).describe('The prompt to track'),
  category: z.string().optional().describe('Prompt category'),
  metadata: z.object({
    wordCount: z.number().min(0).optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
    hasCode: z.boolean().optional(),
    frameworks: z.array(z.string().max(50)).max(10).optional(),
  }).optional(),
  quickScore: z.number().min(0).max(100).optional(),
});

/**
 * Cache for word count calculation
 */
const wordCountCache = new Map();

/**
 * Calculate word count with caching
 * @param {string} text - Text to count words
 * @returns {number} Word count
 */
function getWordCount(text) {
  // Use cached value if available
  if (wordCountCache.has(text)) {
    return wordCountCache.get(text);
  }
  
  // Calculate and cache
  const count = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Limit cache size to prevent memory issues
  if (wordCountCache.size > 100) {
    const firstKey = wordCountCache.keys().next().value;
    wordCountCache.delete(firstKey);
  }
  
  wordCountCache.set(text, count);
  return count;
}

/**
 * Handle prompt tracking requests
 * @param {Object} args - Request arguments
 * @returns {Promise<Object>} MCP response
 */
export async function handleTrack(args) {
  try {
    // Validate input
    const validated = TrackSchema.parse(args);
    const { prompt, category, metadata, quickScore } = validated;
    
    // Check if Langfuse is configured
    if (!langfuse) {
      console.warn('[Track] Langfuse not configured, skipping tracking');
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            tracked: false,
            reason: 'Langfuse not configured',
            category: category || detectCategory(prompt),
            wordCount: getWordCount(prompt),
          }, null, 2)
        }]
      };
    }
    
    // Prepare metadata
    const detectedCategory = category || detectCategory(prompt);
    const wordCount = metadata?.wordCount || getWordCount(prompt);
    
    const enrichedMetadata = {
      category: detectedCategory,
      wordCount,
      timestamp: new Date().toISOString(),
      promptLength: prompt.length,
      ...metadata,
    };
    
    // Create trace with timeout
    const tracePromise = langfuse.trace({
      name: 'prompt-tracking',
      input: prompt.substring(0, 1000), // Limit input size for performance
      metadata: enrichedMetadata,
    });
    
    // Use Promise.race for timeout
    const trace = await Promise.race([
      tracePromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Langfuse trace timeout')), 5000)
      )
    ]);
    
    // Add quick score if provided
    if (quickScore !== undefined && trace) {
      try {
        await Promise.race([
          trace.score({
            name: 'quick-evaluation',
            value: quickScore,
            comment: `Automated tracking score for ${detectedCategory} prompt`,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Score timeout')), 2000)
          )
        ]);
      } catch (scoreError) {
        console.error('[Track] Failed to add score:', scoreError.message);
        // Continue even if scoring fails
      }
    }
    
    // End trace
    if (trace && trace.end) {
      await trace.end();
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          tracked: true,
          traceId: trace?.id || 'unknown',
          category: detectedCategory,
          wordCount,
          promptLength: prompt.length,
          hasScore: quickScore !== undefined,
        }, null, 2)
      }]
    };
    
  } catch (error) {
    // Enhanced error handling
    console.error('[Track] Error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Validation failed',
            details: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            })),
          }, null, 2)
        }]
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Failed to track prompt',
          message: error.message,
          type: error.constructor.name,
        }, null, 2)
      }]
    };
  }
}

/**
 * Category detection patterns with priority ordering
 */
const CATEGORY_PATTERNS = [
  { 
    category: 'react', 
    pattern: /\b(react|component|jsx|tsx|hook|state|props|redux|context|useState|useEffect)\b/i,
    priority: 1
  },
  { 
    category: 'api', 
    pattern: /\b(api|endpoint|fastapi|rest|graphql|route|request|response|http|swagger)\b/i,
    priority: 2
  },
  { 
    category: 'database', 
    pattern: /\b(database|sql|query|schema|migration|table|index|postgres|mysql|mongodb)\b/i,
    priority: 3
  },
  { 
    category: 'testing', 
    pattern: /\b(test|jest|mocha|cypress|unit|integration|e2e|mock|spy|stub)\b/i,
    priority: 4
  },
  { 
    category: 'devops', 
    pattern: /\b(docker|kubernetes|ci|cd|deploy|pipeline|aws|azure|gcp|terraform)\b/i,
    priority: 5
  },
  { 
    category: 'security', 
    pattern: /\b(security|auth|authentication|authorization|jwt|oauth|encryption|vulnerability)\b/i,
    priority: 6
  },
  { 
    category: 'question', 
    pattern: /^(how|what|why|when|where|can|should|is|does|explain|help)/i,
    priority: 7
  },
];

/**
 * Detect category from prompt content using pattern matching
 * @param {string} prompt - The prompt to categorize
 * @returns {string} Detected category
 */
function detectCategory(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return 'general';
  }
  
  // Check each pattern in priority order
  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(prompt)) {
      return category;
    }
  }
  
  // Default category
  return 'general';
}