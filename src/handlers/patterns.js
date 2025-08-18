import { PatternsSchema } from '../tools/schemas.js';
import { extractPatterns } from '../patterns/extractor.js';

export async function handlePatterns(args) {
  const { minScore, limit } = PatternsSchema.parse(args);
  
  // Extract patterns from high-scoring prompts
  const patterns = await extractPatterns(minScore, limit);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(patterns, null, 2)
    }]
  };
}