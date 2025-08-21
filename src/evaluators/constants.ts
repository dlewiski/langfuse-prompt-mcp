/**
 * Constants for prompt evaluation criteria
 * 
 * Centralizes all magic numbers, regex patterns, and scoring thresholds
 * used in prompt evaluation to improve maintainability.
 */

// Scoring base values and increments
export const SCORING = {
  // Base scores for each criterion
  BASE: {
    CLARITY: 0.5,
    STRUCTURE: 0.3,
    EXAMPLES: 0.2,
    CHAIN_OF_THOUGHT: 0.2,
    TECH_SPECIFICITY: 0.3,
    ERROR_HANDLING: 0.2,
    PERFORMANCE: 0.5,
    TESTING: 0.3,
    OUTPUT_FORMAT: 0.4,
    DEPLOYMENT: 0.5,
  },
  
  // Score increments
  INCREMENT: {
    SMALL: 0.1,
    MEDIUM: 0.2,
    LARGE: 0.3,
    EXTRA_LARGE: 0.4,
  },
  
  MAX_SCORE: 1.0,
};

// Clarity evaluation patterns
export const CLARITY_PATTERNS = {
  REQUIREMENT_WORDS: /MUST|REQUIRED/,
  SPECIFICITY_WORDS: /specifically|exactly/,
  MULTIPLE_QUESTIONS: /\?{2,}/,
  OPTIMAL_LENGTH: {
    MIN: 100,
    MAX: 2000,
  },
};

// Structure evaluation patterns
export const STRUCTURE_PATTERNS = {
  XML_TAGS: /<\w+>.*<\/\w+>/s,
  MARKDOWN_HEADERS: /#{1,3}\s+.+/m,
  NUMBERED_LISTS: /^\d+\.\s+.+/m,
  BULLET_POINTS: /^[-*]\s+.+/m,
};

// Example evaluation patterns
export const EXAMPLE_PATTERNS = {
  INDICATORS: /<example>|Example:|For example|e\.g\./gi,
  SCORE_BY_COUNT: {
    NONE: { count: 0, score: 0.2 },
    ONE: { count: 1, score: 0.6 },
    OPTIMAL: { min: 2, max: 3, score: 1.0 },
    TOO_MANY: { score: 0.8 },
  },
};

// Chain of thought patterns
export const CHAIN_PATTERNS = {
  THINKING_TAGS: /<thinking>|Let me think|step by step/i,
  SEQUENTIAL_WORDS: /First,.*Then,.*Finally,/is,
  REASONING_WORDS: /reasoning|approach|consider/i,
};

// Technical specificity patterns
export const TECH_PATTERNS = {
  TECH_TERMS: /React|FastAPI|TypeScript|Python|API|component|endpoint|database/gi,
  VERSION_INDICATORS: /version|v\d+|\d+\.\d+/i,
  FRAMEWORK_WORDS: /framework|library|package/i,
  MIN_TECH_TERMS: 3,
};

// Error handling patterns
export const ERROR_PATTERNS = {
  ERROR_WORDS: /error|exception|failure|edge case/i,
  HANDLING_WORDS: /try|catch|handle|recover/i,
  VALIDATION_WORDS: /validation|sanitize|verify/i,
};

// Performance patterns
export const PERF_PATTERNS = {
  PERFORMANCE_WORDS: /performance|optimize|efficient|fast/i,
  OPTIMIZATION_TECHNIQUES: /cache|lazy|async|concurrent/i,
};

// Testing patterns
export const TEST_PATTERNS = {
  TEST_WORDS: /test|testing|unit test|integration/i,
  TEST_CONCEPTS: /coverage|assertion|mock/i,
};

// Output format patterns
export const FORMAT_PATTERNS = {
  FORMAT_WORDS: /format|structure|output|return/i,
  FORMAT_TYPES: /JSON|XML|markdown|code/i,
  FORMAT_EXAMPLES: /<output>|```/g,
};

// Deployment patterns
export const DEPLOY_PATTERNS = {
  DEPLOYMENT_WORDS: /deploy|production|environment|docker/i,
  SECURITY_WORDS: /security|authentication|authorization/i,
};