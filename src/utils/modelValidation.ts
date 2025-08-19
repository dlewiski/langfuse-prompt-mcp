/**
 * Model Optimization Validation Utilities
 * Ensures optimizations maintain quality and correctness
 */

/**
 * Validates that optimizations preserve semantic meaning
 * @param {string} original - Original prompt
 * @param {string} optimized - Optimized prompt
 * @returns {Object} Validation result with details
 */
export function validateSemanticPreservation(original, optimized) {
  const validation = {
    passed: true,
    issues: [],
    score: 100
  };
  
  // Extract key entities from original
  const originalEntities = extractKeyEntities(original);
  const optimizedEntities = extractKeyEntities(optimized);
  
  // Check if all key entities are preserved
  const missingEntities = originalEntities.filter(
    entity => !optimizedEntities.includes(entity)
  );
  
  if (missingEntities.length > 0) {
    validation.passed = false;
    validation.issues.push(`Missing entities: ${missingEntities.join(', ')}`);
    validation.score -= missingEntities.length * 10;
  }
  
  // Check for major structural changes
  const originalSentenceCount = countSentences(original);
  const optimizedSentenceCount = countSentences(optimized);
  
  if (Math.abs(originalSentenceCount - optimizedSentenceCount) > originalSentenceCount * 0.5) {
    validation.issues.push('Significant structural change detected');
    validation.score -= 20;
  }
  
  return validation;
}

/**
 * Validates model-specific syntax and structure
 * @param {string} prompt - Optimized prompt
 * @param {string} model - Target model
 * @returns {Object} Syntax validation result
 */
export function validateModelSyntax(prompt, model) {
  const validation = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  switch (model) {
    case 'claude':
      // Validate XML structure
      const xmlTags = prompt.match(/<([^>]+)>/g) || [];
      const openTags = xmlTags.filter(tag => !tag.startsWith('</'));
      const closeTags = xmlTags.filter(tag => tag.startsWith('</'));
      
      if (openTags.length !== closeTags.length) {
        validation.valid = false;
        validation.errors.push('Unbalanced XML tags');
      }
      
      // Check for proper nesting
      const tagStack = [];
      for (const tag of xmlTags) {
        if (tag.startsWith('</')) {
          const tagName = tag.slice(2, -1);
          if (tagStack[tagStack.length - 1] !== tagName) {
            validation.valid = false;
            validation.errors.push(`Improperly nested tag: ${tag}`);
          }
          tagStack.pop();
        } else {
          const tagName = tag.slice(1, -1).split(' ')[0];
          tagStack.push(tagName);
        }
      }
      
      if (tagStack.length > 0) {
        validation.valid = false;
        validation.errors.push(`Unclosed tags: ${tagStack.join(', ')}`);
      }
      break;
      
    case 'gpt':
      // Validate JSON structure if present
      if (prompt.includes('{"') || prompt.includes('[\n')) {
        try {
          // Extract JSON blocks
          const jsonBlocks = prompt.match(/\{[\s\S]*?\}/g) || [];
          for (const block of jsonBlocks) {
            JSON.parse(block);
          }
        } catch (error) {
          validation.valid = false;
          validation.errors.push(`Invalid JSON structure: ${error.message}`);
        }
      }
      
      // Check for valid message format
      if (prompt.includes('"role":')) {
        if (!prompt.includes('"content":')) {
          validation.valid = false;
          validation.errors.push('Message format missing content field');
        }
      }
      break;
      
    case 'gemini':
      // Validate markdown structure
      const codeBlocks = prompt.match(/```[\s\S]*?```/g) || [];
      for (const block of codeBlocks) {
        if (!block.endsWith('```')) {
          validation.valid = false;
          validation.errors.push('Unclosed code block');
        }
      }
      
      // Check heading hierarchy
      const headings = prompt.match(/^#{1,6}\s/gm) || [];
      let prevLevel = 0;
      for (const heading of headings) {
        const level = heading.indexOf(' ');
        if (level - prevLevel > 1) {
          validation.warnings.push('Heading hierarchy skip detected');
        }
        prevLevel = level;
      }
      break;
  }
  
  return validation;
}

/**
 * Validates that optimizations meet quality thresholds
 * @param {Object} optimizationResult - Result from optimization
 * @returns {Object} Quality validation result
 */
export function validateOptimizationQuality(optimizationResult) {
  const validation = {
    meetsThreshold: true,
    issues: [],
    recommendations: []
  };
  
  // Check improvement count
  if (optimizationResult.metrics.improvementCount < 3) {
    validation.issues.push('Insufficient improvements applied');
    validation.recommendations.push('Consider applying more optimization techniques');
  }
  
  // Check estimated score
  if (optimizationResult.metrics.estimatedScore < 70) {
    validation.meetsThreshold = false;
    validation.issues.push('Score below quality threshold');
    validation.recommendations.push('Apply additional model-specific optimizations');
  }
  
  // Check for over-optimization
  if (optimizationResult.metrics.optimizedLength > optimizationResult.metrics.originalLength * 3) {
    validation.issues.push('Possible over-optimization detected');
    validation.recommendations.push('Review for unnecessary additions');
  }
  
  // Validate model detection confidence
  if (optimizationResult.confidence < 0.5) {
    validation.issues.push('Low model detection confidence');
    validation.recommendations.push('Consider specifying target model explicitly');
  }
  
  return validation;
}

/**
 * Performs comprehensive validation of optimization
 * @param {string} original - Original prompt
 * @param {string} optimized - Optimized prompt
 * @param {string} model - Target model
 * @param {Object} metrics - Optimization metrics
 * @returns {Object} Comprehensive validation result
 */
export function validateOptimization(original, optimized, model, metrics) {
  const result = {
    valid: true,
    semantic: validateSemanticPreservation(original, optimized),
    syntax: validateModelSyntax(optimized, model),
    quality: validateOptimizationQuality({ metrics }),
    overallScore: 0
  };
  
  // Calculate overall validation score
  let score = 100;
  
  if (!result.semantic.passed) {
    result.valid = false;
    score -= 30;
  } else {
    score = Math.min(score, result.semantic.score);
  }
  
  if (!result.syntax.valid) {
    result.valid = false;
    score -= 40;
  }
  
  if (!result.quality.meetsThreshold) {
    score -= 20;
  }
  
  result.overallScore = Math.max(0, score);
  
  // Generate summary
  result.summary = generateValidationSummary(result);
  
  return result;
}

/**
 * Extracts key entities from prompt
 */
function extractKeyEntities(prompt) {
  const entities = [];
  
  // Extract quoted strings
  const quoted = prompt.match(/"([^"]+)"/g) || [];
  entities.push(...quoted.map(q => q.replace(/"/g, '')));
  
  // Extract capitalized terms
  const capitalized = prompt.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  entities.push(...capitalized);
  
  // Extract numbers
  const numbers = prompt.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  entities.push(...numbers);
  
  // Extract technical terms
  const technical = prompt.match(/\b(?:API|URL|JSON|XML|SQL|HTTP|HTTPS)\b/gi) || [];
  entities.push(...technical);
  
  return [...new Set(entities)]; // Remove duplicates
}

/**
 * Counts sentences in text
 */
function countSentences(text) {
  const sentences = text.match(/[.!?]+/g) || [];
  return sentences.length || 1;
}

/**
 * Generates validation summary
 */
function generateValidationSummary(result) {
  const lines = [];
  
  if (result.valid) {
    lines.push('✅ Optimization validation passed');
  } else {
    lines.push('❌ Optimization validation failed');
  }
  
  lines.push(`Overall Score: ${result.overallScore}/100`);
  
  if (result.semantic.issues.length > 0) {
    lines.push(`Semantic Issues: ${result.semantic.issues.join(', ')}`);
  }
  
  if (result.syntax.errors.length > 0) {
    lines.push(`Syntax Errors: ${result.syntax.errors.join(', ')}`);
  }
  
  if (result.quality.issues.length > 0) {
    lines.push(`Quality Issues: ${result.quality.issues.join(', ')}`);
  }
  
  if (result.quality.recommendations.length > 0) {
    lines.push(`Recommendations: ${result.quality.recommendations.join('; ')}`);
  }
  
  return lines.join('\n');
}

/**
 * Checks if optimization is safe to apply
 * @param {Object} validationResult - Validation result
 * @returns {boolean} Whether optimization is safe
 */
export function isOptimizationSafe(validationResult) {
  return validationResult.valid && 
         validationResult.overallScore >= 70 &&
         validationResult.syntax.errors.length === 0;
}

module.exports = {
  validateSemanticPreservation,
  validateModelSyntax,
  validateOptimizationQuality,
  validateOptimization,
  isOptimizationSafe
};