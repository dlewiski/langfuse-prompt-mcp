import { EVALUATION_CRITERIA, langfuse } from '../config.js';
import {
  evaluateClarity,
  evaluateStructure,
  evaluateExamples,
  evaluateChainOfThought,
  evaluateTechSpecificity,
  evaluateErrorHandling,
  evaluatePerformance,
  evaluateTesting,
  evaluateOutputFormat,
  evaluateDeployment,
} from './criteria.js';
import { generateRecommendations } from './recommendations.js';
import { createLLMEvaluationRequest, isLLMAvailable } from './llm-judge.js';

// Map criterion names to evaluator functions
const evaluators = {
  clarity: evaluateClarity,
  structure: evaluateStructure,
  examples: evaluateExamples,
  chainOfThought: evaluateChainOfThought,
  techSpecificity: evaluateTechSpecificity,
  errorHandling: evaluateErrorHandling,
  performance: evaluatePerformance,
  testing: evaluateTesting,
  outputFormat: evaluateOutputFormat,
  deployment: evaluateDeployment,
};

export async function evaluatePrompt(prompt, promptId = null, useLLM = true) {
  // Check if LLM evaluation is requested and available
  if (useLLM && isLLMAvailable()) {
    // Return a request for LLM evaluation
    // This will be handled by the MCP handler to communicate with Claude Code
    return createLLMEvaluationRequest(prompt);
  }
  
  // Fallback to rule-based evaluation
  const scores = {};
  let totalScore = 0;
  let totalWeight = 0;

  // Evaluate each criterion
  for (const [criterion, config] of Object.entries(EVALUATION_CRITERIA)) {
    const evaluator = evaluators[criterion];
    const score = evaluator ? evaluator(prompt) : 0;
    
    scores[criterion] = {
      score,
      weighted: score * config.weight,
      description: config.description,
    };
    
    totalScore += score * config.weight;
    totalWeight += config.weight;
  }

  const overallScore = (totalScore / totalWeight) * 100;

  // Track in Langfuse if promptId provided
  if (promptId) {
    await langfuse.score({
      name: 'prompt-evaluation',
      value: overallScore,
      promptId,
      comment: JSON.stringify(scores),
    });
  }

  return {
    overallScore,
    scores,
    recommendations: generateRecommendations(scores),
    evaluationType: 'rule-based'
  };
}