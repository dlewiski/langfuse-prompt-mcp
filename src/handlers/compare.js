import { CompareSchema } from '../tools/schemas.js';
import { evaluatePrompt } from '../evaluators/index.js';

export async function handleCompare(args) {
  const { prompt1, prompt2, promptId } = CompareSchema.parse(args);
  
  // Evaluate both prompts
  const [eval1, eval2] = await Promise.all([
    evaluatePrompt(prompt1),
    evaluatePrompt(prompt2)
  ]);
  
  // Analyze differences
  const comparison = {
    version1: {
      score: eval1.overallScore,
      strengths: getStrengths(eval1.scores),
      weaknesses: getWeaknesses(eval1.scores),
    },
    version2: {
      score: eval2.overallScore,
      strengths: getStrengths(eval2.scores),
      weaknesses: getWeaknesses(eval2.scores),
    },
    recommendation: eval2.overallScore > eval1.overallScore ? 'version2' : 'version1',
    improvement: Math.abs(eval2.overallScore - eval1.overallScore),
    detailedComparison: compareScores(eval1.scores, eval2.scores),
  };
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(comparison, null, 2)
    }]
  };
}

function getStrengths(scores) {
  return Object.entries(scores)
    .filter(([_, data]) => data.score >= 0.8)
    .map(([criterion, data]) => ({
      criterion,
      score: data.score,
      description: data.description,
    }));
}

function getWeaknesses(scores) {
  return Object.entries(scores)
    .filter(([_, data]) => data.score < 0.6)
    .map(([criterion, data]) => ({
      criterion,
      score: data.score,
      description: data.description,
    }));
}

function compareScores(scores1, scores2) {
  const comparison = {};
  
  for (const criterion of Object.keys(scores1)) {
    const diff = scores2[criterion].score - scores1[criterion].score;
    comparison[criterion] = {
      version1: scores1[criterion].score,
      version2: scores2[criterion].score,
      difference: diff,
      improved: diff > 0,
    };
  }
  
  return comparison;
}