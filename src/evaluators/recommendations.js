export function generateRecommendations(scores) {
  const recommendations = [];
  
  for (const [criterion, data] of Object.entries(scores)) {
    if (data.score < 0.7) {
      recommendations.push({
        criterion,
        currentScore: data.score,
        recommendation: getRecommendation(criterion),
        impact: `+${Math.round((1 - data.score) * data.weighted * 10)}% potential improvement`,
      });
    }
  }
  
  return recommendations.sort((a, b) => b.impact.localeCompare(a.impact));
}

export function getRecommendation(criterion) {
  const recommendations = {
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