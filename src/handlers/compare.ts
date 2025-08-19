/**
 * Compare Handler
 * Compares two prompt versions with detailed analysis
 */

import { CompareSchema, type CompareInput } from '../tools/schemas.js';
import { evaluatePrompt } from '../evaluators/index.js';
import { successResponse, errorResponse, llmTaskResponse } from '../utils/response.js';
import { handlerLogger } from '../utils/logger.js';
import type { 
  ComparisonResult,
  EvaluationResult,
  EvaluationCriterion 
} from '../types/domain.js';
import type { MCPRequestContext } from '../types/mcp.js';

/**
 * Criterion difference analysis
 */
interface CriterionDifference {
  criterion: EvaluationCriterion;
  prompt1Score: number;
  prompt2Score: number;
  difference: number;
  winner: 'prompt1' | 'prompt2' | 'tie';
}

/**
 * Handle compare tool requests
 */
export async function handleCompare(
  args: unknown,
  context?: MCPRequestContext
): Promise<ReturnType<typeof successResponse | typeof errorResponse | typeof llmTaskResponse>> {
  try {
    // Validate input
    const { prompt1, prompt2, promptId }: CompareInput = CompareSchema.parse(args);
    
    // Evaluate both prompts
    const [eval1Result, eval2Result] = await Promise.all([
      evaluatePrompt(prompt1, promptId),
      evaluatePrompt(prompt2, promptId)
    ]);
    
    // Check if either evaluation requires LLM delegation
    if (isLLMEvaluationRequest(eval1Result) || isLLMEvaluationRequest(eval2Result)) {
      return llmTaskResponse(
        'prompt-comparison-judge',
        'Compare the two prompts and provide detailed analysis',
        'parseComparisonResult'
      );
    }
    
    const eval1 = eval1Result as EvaluationResult;
    const eval2 = eval2Result as EvaluationResult;
    
    // Analyze differences
    const criterionDifferences = analyzeCriterionDifferences(eval1, eval2);
    const keyDifferences = identifyKeyDifferences(criterionDifferences);
    
    // Determine winner
    const scoreDifference = eval2.totalScore - eval1.totalScore;
    const winner = determineWinner(scoreDifference);
    
    // Generate comparison result
    const result: ComparisonResult = {
      prompt1: {
        text: prompt1,
        score: eval1.totalScore,
        strengths: extractStrengths(eval1),
        weaknesses: extractWeaknesses(eval1),
      },
      prompt2: {
        text: prompt2,
        score: eval2.totalScore,
        strengths: extractStrengths(eval2),
        weaknesses: extractWeaknesses(eval2),
      },
      winner,
      scoreDifference: Math.abs(scoreDifference),
      keyDifferences,
      recommendation: generateRecommendation(winner, scoreDifference, keyDifferences),
    };
    
    return successResponse(result);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    handlerLogger.error('Error in handleCompare:', errorMessage);
    
    return errorResponse('Failed to compare prompts', {
      message: errorMessage,
    });
  }
}

/**
 * Check if evaluation result is an LLM delegation request
 */
function isLLMEvaluationRequest(result: unknown): boolean {
  return (
    typeof result === 'object' &&
    result !== null &&
    'type' in result &&
    (result as any).type === 'llm_evaluation'
  );
}

/**
 * Analyze differences between criterion scores
 */
function analyzeCriterionDifferences(
  eval1: EvaluationResult,
  eval2: EvaluationResult
): CriterionDifference[] {
  const differences: CriterionDifference[] = [];
  
  for (const criterion of Object.keys(eval1.scores) as EvaluationCriterion[]) {
    const score1 = eval1.scores[criterion]?.score || 0;
    const score2 = eval2.scores[criterion]?.score || 0;
    const difference = score2 - score1;
    
    differences.push({
      criterion,
      prompt1Score: score1,
      prompt2Score: score2,
      difference,
      winner: difference > 2 ? 'prompt2' : difference < -2 ? 'prompt1' : 'tie',
    });
  }
  
  return differences.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
}

/**
 * Identify key differences between prompts
 */
function identifyKeyDifferences(differences: CriterionDifference[]): string[] {
  const keyDiffs: string[] = [];
  
  // Get top 3 most significant differences
  const significantDiffs = differences
    .filter(d => Math.abs(d.difference) > 5)
    .slice(0, 3);
  
  for (const diff of significantDiffs) {
    const improvement = diff.difference > 0 ? 'better' : 'worse';
    const amount = Math.abs(diff.difference);
    keyDiffs.push(
      `Prompt 2 is ${amount.toFixed(1)} points ${improvement} in ${diff.criterion}`
    );
  }
  
  // Add overall structure differences
  const structuralDiff = differences.find(d => d.criterion === 'structure');
  if (structuralDiff && Math.abs(structuralDiff.difference) > 3) {
    const better = structuralDiff.difference > 0 ? 'Prompt 2' : 'Prompt 1';
    keyDiffs.push(`${better} has superior structural organization`);
  }
  
  // Add technical specificity differences
  const techDiff = differences.find(d => d.criterion === 'techSpecificity');
  if (techDiff && Math.abs(techDiff.difference) > 3) {
    const better = techDiff.difference > 0 ? 'Prompt 2' : 'Prompt 1';
    keyDiffs.push(`${better} provides more technical detail and precision`);
  }
  
  return keyDiffs;
}

/**
 * Determine the winner based on score difference
 */
function determineWinner(scoreDifference: number): 'prompt1' | 'prompt2' | 'tie' {
  if (Math.abs(scoreDifference) < 3) {
    return 'tie';
  }
  return scoreDifference > 0 ? 'prompt2' : 'prompt1';
}

/**
 * Extract strengths from evaluation
 */
function extractStrengths(evaluation: EvaluationResult): string[] {
  const strengths: string[] = [];
  
  for (const [criterion, score] of Object.entries(evaluation.scores)) {
    if (score.score >= 8) {
      strengths.push(`Strong ${criterion} (${score.score}/10)`);
    }
  }
  
  if (evaluation.strengths && evaluation.strengths.length > 0) {
    strengths.push(...evaluation.strengths);
  }
  
  return strengths.slice(0, 5); // Limit to top 5
}

/**
 * Extract weaknesses from evaluation
 */
function extractWeaknesses(evaluation: EvaluationResult): string[] {
  const weaknesses: string[] = [];
  
  for (const [criterion, score] of Object.entries(evaluation.scores)) {
    if (score.score < 6) {
      weaknesses.push(`Weak ${criterion} (${score.score}/10)`);
    }
  }
  
  if (evaluation.weaknesses && evaluation.weaknesses.length > 0) {
    weaknesses.push(...evaluation.weaknesses);
  }
  
  return weaknesses.slice(0, 5); // Limit to top 5
}

/**
 * Generate recommendation based on comparison
 */
function generateRecommendation(
  winner: 'prompt1' | 'prompt2' | 'tie',
  scoreDifference: number,
  keyDifferences: string[]
): string {
  if (winner === 'tie') {
    return 'Both prompts are roughly equivalent in quality. Choose based on specific use case requirements or combine the best elements of each.';
  }
  
  const winnerName = winner === 'prompt1' ? 'Prompt 1' : 'Prompt 2';
  const loserName = winner === 'prompt1' ? 'Prompt 2' : 'Prompt 1';
  
  if (scoreDifference > 15) {
    return `${winnerName} is significantly better and should be used. Consider applying its successful patterns to improve ${loserName}.`;
  }
  
  if (scoreDifference > 8) {
    return `${winnerName} is notably better overall. ${keyDifferences[0] || 'It shows improvements across multiple criteria.'}`;
  }
  
  return `${winnerName} is slightly better. The main advantage is: ${keyDifferences[0] || 'marginal improvements in key areas.'}`;
}

/**
 * Export handler metadata
 */
export const compareHandlerMetadata = {
  name: 'compare',
  description: 'Compare two prompt versions with detailed analysis',
  inputSchema: CompareSchema,
  supportsLLM: true,
  features: [
    'parallel-evaluation',
    'criterion-comparison',
    'strength-weakness-analysis',
    'winner-determination',
    'recommendation-generation',
  ] as const,
} as const;