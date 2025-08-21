import { needsImprovement } from '../utils/scoring.js';

interface ScoreData {
  score: number;
  weighted: number;
}

interface Recommendation {
  criterion: string;
  currentScore: number;
  recommendation: string;
  impact: string;
  impactScore: number;
}

export function generateRecommendations(scores: Record<string, ScoreData>): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  for (const [criterion, data] of Object.entries(scores)) {
    if (needsImprovement(data.score)) {
      const impactScore = Math.round((1 - data.score) * data.weighted * 10);
      recommendations.push({
        criterion,
        currentScore: data.score,
        recommendation: getRecommendation(criterion),
        impact: `+${impactScore}% potential improvement`,
        impactScore, // Add numeric score for better sorting
      });
    }
  }
  
  // Sort by numeric impact score instead of string comparison
  return recommendations.sort((a, b) => b.impactScore - a.impactScore);
}

export function getRecommendation(criterion: string): string {
  const recommendations: Record<string, string> = {
    clarity: 'Add explicit requirements using "MUST", "SHOULD", and "MAY". Be specific about expected behavior.',
    structure: 'Use XML tags or markdown sections to organize your prompt. Add clear hierarchical structure.',
    examples: 'Include 2-3 examples with input, reasoning, and expected output.',
    chainOfThought: 'Add a <thinking> section or "Let me approach this step by step" to encourage reasoning.',
    techSpecificity: 'Specify exact frameworks, versions, and technical requirements.',
    errorHandling: 'Explicitly mention error scenarios and how they should be handled.',
    performance: 'Include performance requirements and optimization considerations.',
    testing: 'Specify testing requirements and coverage expectations.',
    outputFormat: 'Define the exact output format and structure expected.',
    deployment: 'Add production deployment considerations and requirements.',
  };
  
  return recommendations[criterion] || 'Improve this aspect of your prompt.';
}