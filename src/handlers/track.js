import { langfuse } from '../config.js';
import { z } from 'zod';

const TrackSchema = z.object({
  prompt: z.string().describe('The prompt to track'),
  category: z.string().optional().describe('Prompt category'),
  metadata: z.object({
    wordCount: z.number().optional(),
    complexity: z.string().optional(),
    hasCode: z.boolean().optional(),
    frameworks: z.array(z.string()).optional(),
  }).optional(),
  quickScore: z.number().min(0).max(100).optional(),
});

export async function handleTrack(args) {
  try {
    const { prompt, category, metadata, quickScore } = TrackSchema.parse(args);
    
    // Create a trace in Langfuse
    const trace = langfuse.trace({
      name: 'prompt-tracking',
      input: prompt,
      metadata: {
        category: category || detectCategory(prompt),
        wordCount: metadata?.wordCount || prompt.split(' ').length,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });
    
    // Add a quick score if provided
    if (quickScore !== undefined) {
      await trace.score({
        name: 'quick-evaluation',
        value: quickScore,
        comment: 'Automated tracking score',
      });
    }
    
    // End the trace
    await trace.end();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          tracked: true,
          traceId: trace.id,
          category: category || detectCategory(prompt),
          wordCount: prompt.split(' ').length,
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Failed to track prompt',
          message: error.message,
        }, null, 2)
      }]
    };
  }
}

function detectCategory(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (/react|component|jsx|tsx|hook|state/i.test(lowerPrompt)) {
    return 'react';
  }
  if (/api|endpoint|fastapi|rest|graphql|route/i.test(lowerPrompt)) {
    return 'api';
  }
  if (/database|sql|query|schema|migration/i.test(lowerPrompt)) {
    return 'database';
  }
  if (/\?|how|what|why|explain/i.test(lowerPrompt)) {
    return 'question';
  }
  
  return 'general';
}