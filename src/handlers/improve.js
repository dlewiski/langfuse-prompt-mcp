import { ImproveSchema } from '../tools/schemas.js';
import { evaluatePrompt } from '../evaluators/index.js';
import { applyImprovements } from '../improvers/index.js';

export async function handleImprove(args) {
  const { prompt, promptId, techniques } = ImproveSchema.parse(args);
  
  // First evaluate the current prompt
  const evaluation = await evaluatePrompt(prompt);
  
  // Apply improvements based on evaluation
  const improved = await applyImprovements(prompt, evaluation, techniques);
  
  // Evaluate the improved version
  const improvedEvaluation = await evaluatePrompt(improved.text);
  
  const result = {
    original: {
      text: prompt,
      score: evaluation.overallScore,
    },
    improved: {
      text: improved.text,
      score: improvedEvaluation.overallScore,
      techniquesApplied: improved.techniquesApplied,
    },
    improvement: improvedEvaluation.overallScore - evaluation.overallScore,
    recommendations: improvedEvaluation.recommendations,
  };
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}