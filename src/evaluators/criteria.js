/**
 * Individual criterion evaluators
 * 
 * Each function evaluates a specific aspect of prompt quality
 * and returns a normalized score between 0 and 1.
 */

import {
  SCORING,
  CLARITY_PATTERNS,
  STRUCTURE_PATTERNS,
  EXAMPLE_PATTERNS,
  CHAIN_PATTERNS,
  TECH_PATTERNS,
  ERROR_PATTERNS,
  PERF_PATTERNS,
  TEST_PATTERNS,
  FORMAT_PATTERNS,
  DEPLOY_PATTERNS,
} from './constants.js';

export function evaluateClarity(prompt) {
  let score = SCORING.BASE.CLARITY;
  
  if (CLARITY_PATTERNS.REQUIREMENT_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  if (CLARITY_PATTERNS.SPECIFICITY_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.SMALL;
  }
  if (prompt.length > CLARITY_PATTERNS.OPTIMAL_LENGTH.MIN && 
      prompt.length < CLARITY_PATTERNS.OPTIMAL_LENGTH.MAX) {
    score += SCORING.INCREMENT.SMALL;
  }
  if (!CLARITY_PATTERNS.MULTIPLE_QUESTIONS.test(prompt)) {
    score += SCORING.INCREMENT.SMALL;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluateStructure(prompt) {
  let score = SCORING.BASE.STRUCTURE;
  
  if (STRUCTURE_PATTERNS.XML_TAGS.test(prompt)) {
    score += SCORING.INCREMENT.LARGE;
  }
  if (STRUCTURE_PATTERNS.MARKDOWN_HEADERS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  if (STRUCTURE_PATTERNS.NUMBERED_LISTS.test(prompt)) {
    score += SCORING.INCREMENT.SMALL;
  }
  if (STRUCTURE_PATTERNS.BULLET_POINTS.test(prompt)) {
    score += SCORING.INCREMENT.SMALL;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluateExamples(prompt) {
  const exampleMatches = prompt.match(EXAMPLE_PATTERNS.INDICATORS);
  const count = exampleMatches ? exampleMatches.length : 0;
  
  const { NONE, ONE, OPTIMAL, TOO_MANY } = EXAMPLE_PATTERNS.SCORE_BY_COUNT;
  
  if (count === NONE.count) return NONE.score;
  if (count === ONE.count) return ONE.score;
  if (count >= OPTIMAL.min && count <= OPTIMAL.max) return OPTIMAL.score;
  return TOO_MANY.score;
}

export function evaluateChainOfThought(prompt) {
  let score = SCORING.BASE.CHAIN_OF_THOUGHT;
  
  if (CHAIN_PATTERNS.THINKING_TAGS.test(prompt)) {
    score += SCORING.INCREMENT.EXTRA_LARGE;
  }
  if (CHAIN_PATTERNS.SEQUENTIAL_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  if (CHAIN_PATTERNS.REASONING_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluateTechSpecificity(prompt) {
  let score = SCORING.BASE.TECH_SPECIFICITY;
  const matches = prompt.match(TECH_PATTERNS.TECH_TERMS);
  
  if (matches && matches.length > TECH_PATTERNS.MIN_TECH_TERMS) {
    score += SCORING.INCREMENT.EXTRA_LARGE;
  }
  if (TECH_PATTERNS.VERSION_INDICATORS.test(prompt)) {
    score += SCORING.INCREMENT.SMALL;
  }
  if (TECH_PATTERNS.FRAMEWORK_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluateErrorHandling(prompt) {
  let score = SCORING.BASE.ERROR_HANDLING;
  
  if (ERROR_PATTERNS.ERROR_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.EXTRA_LARGE;
  }
  if (ERROR_PATTERNS.HANDLING_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  if (ERROR_PATTERNS.VALIDATION_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluatePerformance(prompt) {
  let score = SCORING.BASE.PERFORMANCE;
  
  if (PERF_PATTERNS.PERFORMANCE_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.LARGE;
  }
  if (PERF_PATTERNS.OPTIMIZATION_TECHNIQUES.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluateTesting(prompt) {
  let score = SCORING.BASE.TESTING;
  
  if (TEST_PATTERNS.TEST_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.EXTRA_LARGE;
  }
  if (TEST_PATTERNS.TEST_CONCEPTS.test(prompt)) {
    score += SCORING.INCREMENT.LARGE;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluateOutputFormat(prompt) {
  let score = SCORING.BASE.OUTPUT_FORMAT;
  
  if (FORMAT_PATTERNS.FORMAT_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.LARGE;
  }
  if (FORMAT_PATTERNS.FORMAT_TYPES.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  if (FORMAT_PATTERNS.FORMAT_EXAMPLES.test(prompt)) {
    score += SCORING.INCREMENT.SMALL;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}

export function evaluateDeployment(prompt) {
  let score = SCORING.BASE.DEPLOYMENT;
  
  if (DEPLOY_PATTERNS.DEPLOYMENT_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.LARGE;
  }
  if (DEPLOY_PATTERNS.SECURITY_WORDS.test(prompt)) {
    score += SCORING.INCREMENT.MEDIUM;
  }
  
  return Math.min(score, SCORING.MAX_SCORE);
}