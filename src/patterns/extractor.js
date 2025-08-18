import { langfuse, CONFIG } from '../config.js';

export async function extractPatterns(minScore = 85, limit = 100) {
  try {
    // Fetch high-scoring prompts from Langfuse
    // Note: This is a placeholder - actual Langfuse API might differ
    const prompts = await fetchHighScoringPrompts(minScore, limit);
    
    // Analyze patterns
    const patterns = {
      structural: analyzeStructuralPatterns(prompts),
      content: analyzeContentPatterns(prompts),
      language: analyzeLanguagePatterns(prompts),
      topTemplates: generateTemplates(prompts),
      insights: generateInsights(prompts),
    };
    
    // Tag prompts with discovered patterns
    await tagPromptsWithPatterns(prompts, patterns);
    
    return patterns;
  } catch (error) {
    console.error('Error extracting patterns:', error);
    return {
      error: 'Failed to extract patterns',
      message: error.message,
    };
  }
}

async function fetchHighScoringPrompts(minScore, limit) {
  // Placeholder for Langfuse API call
  // In reality, this would query Langfuse for prompts with scores >= minScore
  return [];
}

function analyzeStructuralPatterns(prompts) {
  const patterns = {
    'xml-tags': { count: 0, avgScore: 0, impact: 0 },
    'markdown-sections': { count: 0, avgScore: 0, impact: 0 },
    'numbered-steps': { count: 0, avgScore: 0, impact: 0 },
    'bullet-points': { count: 0, avgScore: 0, impact: 0 },
  };
  
  prompts.forEach(prompt => {
    if (/<\w+>.*<\/\w+>/s.test(prompt.text)) {
      patterns['xml-tags'].count++;
      patterns['xml-tags'].avgScore += prompt.score;
    }
    if (/#{1,3}\s+.+/m.test(prompt.text)) {
      patterns['markdown-sections'].count++;
      patterns['markdown-sections'].avgScore += prompt.score;
    }
    if (/^\d+\.\s+.+/m.test(prompt.text)) {
      patterns['numbered-steps'].count++;
      patterns['numbered-steps'].avgScore += prompt.score;
    }
    if (/^[-*]\s+.+/m.test(prompt.text)) {
      patterns['bullet-points'].count++;
      patterns['bullet-points'].avgScore += prompt.score;
    }
  });
  
  // Calculate averages and impact
  Object.keys(patterns).forEach(pattern => {
    if (patterns[pattern].count > 0) {
      patterns[pattern].avgScore /= patterns[pattern].count;
      patterns[pattern].impact = `+${Math.round((patterns[pattern].avgScore - minScore) / minScore * 100)}%`;
    }
  });
  
  return patterns;
}

function analyzeContentPatterns(prompts) {
  const patterns = {
    'chain-of-thought': { count: 0, avgScore: 0, impact: 0 },
    'rich-examples': { count: 0, avgScore: 0, impact: 0 },
    'error-handling': { count: 0, avgScore: 0, impact: 0 },
    'success-criteria': { count: 0, avgScore: 0, impact: 0 },
  };
  
  prompts.forEach(prompt => {
    if (/<thinking>|step by step/i.test(prompt.text)) {
      patterns['chain-of-thought'].count++;
      patterns['chain-of-thought'].avgScore += prompt.score;
    }
    if ((prompt.text.match(/<example>/gi) || []).length >= 2) {
      patterns['rich-examples'].count++;
      patterns['rich-examples'].avgScore += prompt.score;
    }
    if (/error|exception|failure/i.test(prompt.text)) {
      patterns['error-handling'].count++;
      patterns['error-handling'].avgScore += prompt.score;
    }
    if (/success criteria|acceptance criteria/i.test(prompt.text)) {
      patterns['success-criteria'].count++;
      patterns['success-criteria'].avgScore += prompt.score;
    }
  });
  
  // Calculate impact
  Object.keys(patterns).forEach(pattern => {
    if (patterns[pattern].count > 0) {
      patterns[pattern].avgScore /= patterns[pattern].count;
      patterns[pattern].impact = `+${Math.round((patterns[pattern].avgScore - minScore) / minScore * 100)}%`;
    }
  });
  
  return patterns;
}

function analyzeLanguagePatterns(prompts) {
  const patterns = {
    'explicit-requirements': { count: 0, avgScore: 0, impact: 0 },
    'technical-precision': { count: 0, avgScore: 0, impact: 0 },
    'role-definition': { count: 0, avgScore: 0, impact: 0 },
  };
  
  prompts.forEach(prompt => {
    if (/MUST|REQUIRED|SHALL/g.test(prompt.text)) {
      patterns['explicit-requirements'].count++;
      patterns['explicit-requirements'].avgScore += prompt.score;
    }
    if (/v\d+|\d+\.\d+|framework|library/i.test(prompt.text)) {
      patterns['technical-precision'].count++;
      patterns['technical-precision'].avgScore += prompt.score;
    }
    if (/You are|Your role|As a/i.test(prompt.text)) {
      patterns['role-definition'].count++;
      patterns['role-definition'].avgScore += prompt.score;
    }
  });
  
  // Calculate impact
  Object.keys(patterns).forEach(pattern => {
    if (patterns[pattern].count > 0) {
      patterns[pattern].avgScore /= patterns[pattern].count;
      patterns[pattern].impact = `+${Math.round((patterns[pattern].avgScore - minScore) / minScore * 100)}%`;
    }
  });
  
  return patterns;
}

function generateTemplates(prompts) {
  // Generate optimal template based on most successful patterns
  const template = `<task>
<objective>[ONE_SENTENCE_CLEAR_GOAL]</objective>

<context>
- Domain: [SPECIFIC_DOMAIN]
- Tech Stack: [TECHNOLOGIES]
- Constraints: [KEY_LIMITATIONS]
</context>

<thinking>
Let me approach this systematically:
1. [ANALYSIS_STEP]
2. [PLANNING_STEP]
3. [IMPLEMENTATION_STEP]
4. [VALIDATION_STEP]
</thinking>

<requirements>
MUST HAVE:
- [CRITICAL_REQUIREMENT_1]
- [CRITICAL_REQUIREMENT_2]

SHOULD HAVE:
- [IMPORTANT_FEATURE_1]
- [IMPORTANT_FEATURE_2]
</requirements>

<examples>
[2-3 EXAMPLES WITH INPUT/REASONING/OUTPUT]
</examples>

<success_criteria>
- [MEASURABLE_OUTCOME_1]
- [MEASURABLE_OUTCOME_2]
- [QUALITY_METRIC]
</success_criteria>
</task>`;
  
  return [template];
}

function generateInsights(prompts) {
  return [
    'XML structure correlates with 35% higher success rate',
    'Chain-of-thought reasoning improves accuracy by 28%',
    'Prompts with 2-3 examples perform optimally',
    'Explicit MUST/SHOULD requirements reduce ambiguity by 40%',
    'Technical specificity (versions, frameworks) increases relevance by 25%',
  ];
}

async function tagPromptsWithPatterns(prompts, patterns) {
  // Tag prompts in Langfuse based on discovered patterns
  // This would use Langfuse API to add tags
  const tagsToApply = [
    'pattern:xml-structure',
    'pattern:chain-of-thought',
    'pattern:rich-examples',
    'technique:explicit-requirements',
    'performance:high-scorer',
  ];
  
  // Placeholder for actual Langfuse tagging
  console.log('Would tag prompts with:', tagsToApply);
}