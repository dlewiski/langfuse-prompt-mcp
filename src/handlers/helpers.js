/**
 * Shared helper functions for handlers
 * 
 * Provides common utilities to reduce code duplication across handler modules.
 */

import { IMPROVEMENT } from '../constants.js';

/**
 * Calculate estimated score based on techniques applied
 * @param {number} baseScore - Original score
 * @param {number} techniqueCount - Number of techniques applied
 * @returns {number} Estimated score
 */
export function calculateEstimatedScore(baseScore, techniqueCount) {
  const score = (baseScore || 50) + (techniqueCount * IMPROVEMENT.SCORE_PER_TECHNIQUE);
  return Math.min(IMPROVEMENT.MAX_SCORE, score);
}

/**
 * Create a prompt version object
 * @param {string} text - Prompt text
 * @param {number} score - Prompt score
 * @returns {Object} Version object
 */
export function createPromptVersion(text, score) {
  return {
    text,
    score: score || 0,
  };
}

/**
 * Create an improved version object
 * @param {string} text - Improved prompt text
 * @param {number} score - Improved score
 * @param {Array} techniquesApplied - List of techniques applied
 * @param {string|null} note - Optional note
 * @returns {Object} Improved version object
 */
export function createImprovedVersion(text, score, techniquesApplied, note = null) {
  const version = {
    text,
    score: score || 0,
    techniquesApplied,
  };
  
  if (note) {
    version.note = note;
  }
  
  return version;
}

/**
 * Format evaluation result for response
 * @param {Object} evaluation - Evaluation result
 * @returns {Object} Formatted evaluation
 */
export function formatEvaluation(evaluation) {
  return {
    overallScore: evaluation.overallScore || 0,
    scores: evaluation.scores || {},
    recommendations: evaluation.recommendations || [],
    improvements: evaluation.improvements || [],
  };
}

/**
 * Create improvement result object
 * @param {Object} original - Original prompt evaluation
 * @param {Object} improved - Improved prompt evaluation
 * @param {Array} techniquesApplied - Techniques applied
 * @returns {Object} Improvement result
 */
export function createImprovementResult(original, improved, techniquesApplied) {
  return {
    original: {
      text: original.text,
      score: original.score || 0,
    },
    improved: {
      text: improved.text,
      score: improved.score || 0,
      techniquesApplied,
    },
    improvement: (improved.score || 0) - (original.score || 0),
    recommendations: improved.recommendations || [],
  };
}

/**
 * Check if score meets improvement threshold
 * @param {number} score - Current score
 * @param {number} targetScore - Target score (default: 85)
 * @returns {boolean} True if score meets threshold
 */
export function meetsImprovementThreshold(score, targetScore = 85) {
  return score >= targetScore;
}

/**
 * Validate handler arguments
 * @param {Object} args - Arguments to validate
 * @param {Array} required - Required field names
 * @returns {Object} Validation result
 */
export function validateArgs(args, required = []) {
  const missing = required.filter(field => !args[field]);
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    };
  }
  
  return { valid: true };
}