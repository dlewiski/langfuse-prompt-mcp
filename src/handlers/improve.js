import { ImproveSchema } from '../tools/schemas.js';
import { evaluatePrompt } from '../evaluators/index.js';
import { applyImprovements } from '../improvers/index.js';
import { optimizePrompt } from '../improvers/modelOptimizer.js';

export async function handleImprove(args) {
  const { prompt, promptId, techniques, targetModel, enableModelOptimization } = ImproveSchema.parse(args);
  
  // Apply model-specific optimization if enabled
  let workingPrompt = prompt;
  let modelOptimizationResult = null;
  
  if (enableModelOptimization !== false) {
    modelOptimizationResult = await optimizePrompt(prompt, {
      targetModel,
      applyBase: true,
      complexity: techniques?.includes('chainOfThought') ? 'high' : 'medium'
    });
    workingPrompt = modelOptimizationResult.optimized;
  }
  
  // First evaluate the current prompt
  const evaluation = await evaluatePrompt(workingPrompt);
  
  // Apply additional improvements based on evaluation
  const improved = await applyImprovements(workingPrompt, evaluation, techniques);
  
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
  
  // Add model optimization details if applied
  if (modelOptimizationResult) {
    result.modelOptimization = {
      detectedModel: modelOptimizationResult.model,
      confidence: modelOptimizationResult.confidence,
      baseImprovements: modelOptimizationResult.improvements.base,
      modelSpecificOptimizations: modelOptimizationResult.improvements.modelSpecific,
      features: modelOptimizationResult.features,
      summary: modelOptimizationResult.summary
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}