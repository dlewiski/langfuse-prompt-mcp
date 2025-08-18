import { EVALUATION_CRITERIA } from '../config.js';

/**
 * LLM-as-a-Judge implementation using Claude Code
 * 
 * This module creates evaluation tasks that will be executed by Claude Sonnet 4
 * through the Task tool in Claude Code, avoiding external API costs.
 */

// Generate the evaluation request for Claude
export function createLLMEvaluationRequest(prompt) {
  return {
    type: 'llm_evaluation',
    description: 'Evaluate prompt using Claude Sonnet 4 as judge',
    agentTask: {
      agent: 'prompt-evaluation-judge',
      description: 'Evaluate prompt quality',
      prompt: `Evaluate this prompt and return a JSON evaluation:\n\n${prompt}`
    }
  };
}

// Generate the improvement request for Claude
export function createLLMImprovementRequest(prompt, evaluation, techniques = []) {
  const techniquesToApply = techniques.length > 0 
    ? techniques 
    : determineAutoTechniques(evaluation);
  
  return {
    type: 'llm_improvement',
    description: 'Improve prompt using Claude 4 Opus',
    agentTask: {
      agent: 'claude4-opus-prompt-optimizer',
      description: 'Apply improvements to prompt',
      context: {
        originalPrompt: prompt,
        evaluation: evaluation,
        techniques: techniquesToApply
      }
    }
  };
}

// Parse LLM evaluation response
export function parseLLMEvaluation(response) {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[1]);
      
      // Add weighted scores
      let totalScore = 0;
      let totalWeight = 0;
      
      for (const [criterion, config] of Object.entries(EVALUATION_CRITERIA)) {
        if (evaluation.scores[criterion]) {
          const score = evaluation.scores[criterion].score;
          const weighted = score * config.weight;
          evaluation.scores[criterion].weighted = weighted;
          evaluation.scores[criterion].description = config.description;
          
          totalScore += weighted;
          totalWeight += config.weight;
        }
      }
      
      // Ensure overall score is calculated correctly
      evaluation.overallScore = Math.round((totalScore / totalWeight) * 100);
      
      return evaluation;
    }
    
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Failed to parse LLM evaluation:', error);
    throw new Error(`Failed to parse evaluation: ${error.message}`);
  }
}

// Determine which techniques to apply based on evaluation
function determineAutoTechniques(evaluation) {
  const techniques = [];
  
  if (!evaluation.scores) return ['xml-structure', 'chain-of-thought', 'rich-examples'];
  
  // Apply techniques based on low scores
  if (evaluation.scores.chainOfThought?.score < 0.6) {
    techniques.push('chain-of-thought');
  }
  if (evaluation.scores.structure?.score < 0.6) {
    techniques.push('xml-structure');
  }
  if (evaluation.scores.examples?.score < 0.6) {
    techniques.push('rich-examples');
  }
  if (evaluation.scores.errorHandling?.score < 0.6) {
    techniques.push('error-handling');
  }
  if (evaluation.scores.outputFormat?.score < 0.6) {
    techniques.push('success-criteria');
  }
  
  // If no specific weaknesses, apply general best practices
  if (techniques.length === 0) {
    techniques.push('xml-structure', 'chain-of-thought');
  }
  
  return techniques;
}

// Check if LLM evaluation is available
export function isLLMAvailable() {
  // In MCP context, we signal that LLM evaluation should be used
  // The actual execution happens in Claude Code
  return true;
}

// Export evaluation criteria for consistency
export { EVALUATION_CRITERIA };