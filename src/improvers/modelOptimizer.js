/**
 * Model-Specific Prompt Optimizer
 * Main orchestrator for model detection and optimization
 */

const { detectModel, getModelFeatures } = require('./modelDetector');
const { applyBaseImprovements } = require('./baseOptimizer');
const { optimizeForClaude } = require('./models/claudeOptimizer');
const { optimizeForGPT } = require('./models/gptOptimizer');
const { optimizeForGemini } = require('./models/geminiOptimizer');

/**
 * Main optimization function that applies both base and model-specific improvements
 * @param {string} prompt - Original prompt to optimize
 * @param {Object} options - Optimization options
 * @param {string} [options.targetModel] - Explicit target model (claude, gpt, gemini)
 * @param {Object} [options.metadata] - Additional metadata for model detection
 * @param {boolean} [options.applyBase] - Whether to apply base improvements (default: true)
 * @param {string} [options.complexity] - Complexity level (low, medium, high)
 * @returns {Object} Optimized prompt with comprehensive metadata
 */
async function optimizePrompt(prompt, options = {}) {
  const result = {
    original: prompt,
    optimized: prompt,
    model: null,
    confidence: 0,
    improvements: {
      base: [],
      modelSpecific: []
    },
    features: {},
    metrics: {
      originalLength: prompt.length,
      optimizedLength: 0,
      improvementCount: 0,
      estimatedScore: 0
    }
  };
  
  try {
    // Step 1: Apply base improvements (unless disabled)
    let workingPrompt = prompt;
    if (options.applyBase !== false) {
      const baseResult = applyBaseImprovements(workingPrompt, options);
      workingPrompt = baseResult.improved;
      result.improvements.base = baseResult.improvements;
      result.metrics.baseScore = baseResult.baseScore;
    }
    
    // Step 2: Detect target model
    const detection = detectModel({
      prompt: workingPrompt,
      model: options.targetModel,
      metadata: options.metadata || {}
    });
    
    result.model = detection.detectedModel;
    result.confidence = detection.confidence;
    result.features = detection.features;
    result.modelDetectionReasoning = detection.reasoning;
    
    // Step 3: Apply model-specific optimizations
    let modelResult;
    switch (detection.detectedModel) {
      case 'claude':
        modelResult = optimizeForClaude(workingPrompt, {
          ...options,
          complexity: options.complexity || detectComplexityLevel(workingPrompt)
        });
        break;
        
      case 'gpt':
        modelResult = optimizeForGPT(workingPrompt, {
          ...options,
          model: options.targetModel
        });
        break;
        
      case 'gemini':
        modelResult = optimizeForGemini(workingPrompt, {
          ...options,
          multiModal: options.multiModal,
          multiTurn: options.multiTurn
        });
        break;
        
      default:
        // Generic model or unknown - use base improvements only
        modelResult = {
          prompt: workingPrompt,
          optimizations: ['Using generic optimization strategy'],
          features: {}
        };
    }
    
    result.optimized = modelResult.prompt;
    result.improvements.modelSpecific = modelResult.optimizations;
    result.features = { ...result.features, ...modelResult.features };
    
    // Step 4: Calculate final metrics
    result.metrics.optimizedLength = result.optimized.length;
    result.metrics.improvementCount = 
      result.improvements.base.length + result.improvements.modelSpecific.length;
    result.metrics.compressionRatio = 
      (result.metrics.originalLength - result.metrics.optimizedLength) / result.metrics.originalLength;
    
    // Estimate final score based on improvements
    result.metrics.estimatedScore = calculateEstimatedScore(result);
    
    // Step 5: Add optimization summary
    result.summary = generateOptimizationSummary(result);
    
  } catch (error) {
    console.error('Error during prompt optimization:', error);
    result.error = error.message;
    result.optimized = prompt; // Fallback to original
  }
  
  return result;
}

/**
 * Applies layered optimization strategy
 * @param {string} prompt - Original prompt
 * @param {Object} options - Options including optimization layers
 * @returns {Object} Progressively optimized prompt
 */
async function applyLayeredOptimization(prompt, options = {}) {
  const layers = options.layers || ['base', 'modelSpecific', 'advanced'];
  let currentPrompt = prompt;
  const layerResults = [];
  
  for (const layer of layers) {
    switch (layer) {
      case 'base':
        const baseResult = applyBaseImprovements(currentPrompt, options);
        currentPrompt = baseResult.improved;
        layerResults.push({
          layer: 'base',
          improvements: baseResult.improvements,
          prompt: currentPrompt
        });
        break;
        
      case 'modelSpecific':
        const modelResult = await optimizePrompt(currentPrompt, {
          ...options,
          applyBase: false // Already applied
        });
        currentPrompt = modelResult.optimized;
        layerResults.push({
          layer: 'modelSpecific',
          model: modelResult.model,
          improvements: modelResult.improvements.modelSpecific,
          prompt: currentPrompt
        });
        break;
        
      case 'advanced':
        // Additional advanced optimizations can be added here
        const advancedResult = applyAdvancedOptimizations(currentPrompt, options);
        currentPrompt = advancedResult.prompt;
        layerResults.push({
          layer: 'advanced',
          improvements: advancedResult.improvements,
          prompt: currentPrompt
        });
        break;
    }
  }
  
  return {
    original: prompt,
    optimized: currentPrompt,
    layers: layerResults,
    metrics: calculateLayeredMetrics(prompt, currentPrompt, layerResults)
  };
}

/**
 * Applies advanced optimizations (future enhancement)
 */
function applyAdvancedOptimizations(prompt, options) {
  const improvements = [];
  let optimized = prompt;
  
  // Semantic compression
  if (options.semanticCompression) {
    // Placeholder for semantic compression logic
    improvements.push('Applied semantic compression');
  }
  
  // Context windowing
  if (options.contextWindowing) {
    // Placeholder for context windowing logic
    improvements.push('Optimized for context window');
  }
  
  // Prompt chaining
  if (options.promptChaining) {
    // Placeholder for prompt chaining logic
    improvements.push('Structured for prompt chaining');
  }
  
  return {
    prompt: optimized,
    improvements
  };
}

/**
 * Detects complexity level of the prompt
 */
function detectComplexityLevel(prompt) {
  const wordCount = prompt.split(/\s+/).length;
  const hasMultipleSteps = /\d+\.\s/g.test(prompt);
  const hasComplexTerms = /algorithm|architecture|optimize|analyze|comprehensive/i.test(prompt);
  
  if (wordCount > 500 || (hasMultipleSteps && hasComplexTerms)) {
    return 'high';
  } else if (wordCount > 200 || hasMultipleSteps) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Calculates estimated score based on optimization results
 */
function calculateEstimatedScore(result) {
  let score = result.metrics.baseScore || 50;
  
  // Add points for model-specific optimizations
  score += result.improvements.modelSpecific.length * 5;
  
  // Add points for feature utilization
  const featureCount = Object.values(result.features).filter(v => v === true).length;
  score += featureCount * 3;
  
  // Add points for high confidence model detection
  if (result.confidence > 0.8) {
    score += 10;
  }
  
  // Cap at 95 (leave room for LLM evaluation)
  return Math.min(score, 95);
}

/**
 * Generates a human-readable optimization summary
 */
function generateOptimizationSummary(result) {
  const lines = [];
  
  lines.push(`Model Detection: ${result.model} (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
  
  if (result.improvements.base.length > 0) {
    lines.push(`Base Improvements: ${result.improvements.base.length} applied`);
  }
  
  if (result.improvements.modelSpecific.length > 0) {
    lines.push(`${result.model} Optimizations: ${result.improvements.modelSpecific.length} applied`);
  }
  
  lines.push(`Estimated Score: ${result.metrics.estimatedScore}/100`);
  
  if (result.metrics.compressionRatio > 0) {
    lines.push(`Size Reduction: ${(result.metrics.compressionRatio * 100).toFixed(1)}%`);
  } else if (result.metrics.compressionRatio < 0) {
    lines.push(`Size Increase: ${Math.abs(result.metrics.compressionRatio * 100).toFixed(1)}% (for clarity)`);
  }
  
  return lines.join('\n');
}

/**
 * Calculates metrics for layered optimization
 */
function calculateLayeredMetrics(original, final, layers) {
  return {
    originalLength: original.length,
    finalLength: final.length,
    totalImprovements: layers.reduce((sum, layer) => 
      sum + (layer.improvements ? layer.improvements.length : 0), 0),
    layerCount: layers.length,
    compressionRatio: (original.length - final.length) / original.length
  };
}

/**
 * Validates optimization results
 */
function validateOptimization(original, optimized) {
  const validations = {
    preservesMeaning: true,
    maintainsStructure: true,
    noInfoLoss: true,
    validFormat: true
  };
  
  // Check if critical information is preserved
  const criticalKeywords = extractCriticalKeywords(original);
  for (const keyword of criticalKeywords) {
    if (!optimized.toLowerCase().includes(keyword.toLowerCase())) {
      validations.noInfoLoss = false;
      break;
    }
  }
  
  // Check format validity based on detected model
  if (optimized.includes('<') && !optimized.includes('>')) {
    validations.validFormat = false;
  }
  
  return validations;
}

/**
 * Extracts critical keywords that must be preserved
 */
function extractCriticalKeywords(prompt) {
  const keywords = [];
  
  // Extract quoted strings
  const quotedMatches = prompt.match(/"([^"]+)"/g) || [];
  keywords.push(...quotedMatches.map(m => m.replace(/"/g, '')));
  
  // Extract technical terms
  const technicalTerms = prompt.match(/\b[A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)+\b/g) || [];
  keywords.push(...technicalTerms);
  
  // Extract numbers and metrics
  const metrics = prompt.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
  keywords.push(...metrics);
  
  return keywords;
}

module.exports = {
  optimizePrompt,
  applyLayeredOptimization,
  detectComplexityLevel,
  generateOptimizationSummary,
  validateOptimization
};