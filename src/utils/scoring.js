/**
 * Scoring utility functions for prompt evaluation
 * 
 * Provides consistent score classification and analysis functions
 */

import { SCORE_THRESHOLDS } from '../constants.js';

/**
 * Classify a score into a quality level
 * @param {number} score - Score between 0 and 1
 * @returns {string} Quality level (excellent, good, moderate, weak, poor, critical)
 */
export function classifyScore(score) {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'excellent';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'good';
  if (score >= SCORE_THRESHOLDS.MODERATE) return 'moderate';
  if (score >= SCORE_THRESHOLDS.WEAK) return 'weak';
  if (score >= SCORE_THRESHOLDS.POOR) return 'poor';
  return 'critical';
}

/**
 * Check if a score meets a minimum threshold
 * @param {number} score - Score to check
 * @param {number} threshold - Threshold to meet
 * @returns {boolean} True if score meets threshold
 */
export function meetsThreshold(score, threshold) {
  return score >= threshold;
}

/**
 * Check if a score indicates a strength
 * @param {number} score - Score to check
 * @returns {boolean} True if score indicates strength
 */
export function isStrength(score) {
  return score >= SCORE_THRESHOLDS.GOOD;
}

/**
 * Check if a score indicates a weakness
 * @param {number} score - Score to check
 * @returns {boolean} True if score indicates weakness
 */
export function isWeakness(score) {
  return score < SCORE_THRESHOLDS.WEAK;
}

/**
 * Check if a score needs improvement
 * @param {number} score - Score to check
 * @returns {boolean} True if score needs improvement
 */
export function needsImprovement(score) {
  return score < SCORE_THRESHOLDS.MODERATE;
}

/**
 * Calculate weighted average of scores
 * @param {Object} scores - Object with score and weight properties
 * @returns {number} Weighted average
 */
export function calculateWeightedAverage(scores) {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [key, data] of Object.entries(scores)) {
    if (data.score !== undefined && data.weight !== undefined) {
      totalScore += data.score * data.weight;
      totalWeight += data.weight;
    } else if (data.score !== undefined && data.weighted !== undefined) {
      totalScore += data.weighted;
      totalWeight += (data.weighted / data.score) || 1;
    }
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Find the top N criteria by score
 * @param {Object} scores - Scores object
 * @param {number} n - Number of top criteria to return
 * @returns {Array} Top criteria sorted by score
 */
export function getTopCriteria(scores, n = 3) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
    .slice(0, n)
    .map(([criterion, data]) => ({
      criterion,
      score: data.score,
      description: data.description,
    }));
}

/**
 * Find the bottom N criteria by score
 * @param {Object} scores - Scores object
 * @param {number} n - Number of bottom criteria to return
 * @returns {Array} Bottom criteria sorted by score (ascending)
 */
export function getBottomCriteria(scores, n = 3) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => (a.score || 0) - (b.score || 0))
    .slice(0, n)
    .map(([criterion, data]) => ({
      criterion,
      score: data.score,
      description: data.description,
    }));
}

/**
 * Group scores by quality level
 * @param {Object} scores - Scores object
 * @returns {Object} Scores grouped by quality level
 */
export function groupByQuality(scores) {
  const grouped = {
    excellent: [],
    good: [],
    moderate: [],
    weak: [],
    poor: [],
    critical: [],
  };

  for (const [criterion, data] of Object.entries(scores)) {
    const level = classifyScore(data.score || 0);
    grouped[level].push({
      criterion,
      score: data.score,
      description: data.description,
    });
  }

  return grouped;
}

/**
 * Calculate improvement potential
 * @param {number} currentScore - Current score (0-100)
 * @param {number} targetScore - Target score (0-100)
 * @returns {number} Improvement potential as percentage
 */
export function calculateImprovementPotential(currentScore, targetScore = 100) {
  return Math.max(0, targetScore - currentScore);
}