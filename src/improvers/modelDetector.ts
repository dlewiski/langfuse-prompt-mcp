/**
 * Model Detection System
 * Identifies the target AI model from prompt content and metadata
 */

import type { ModelDetectionResult, ModelFeatures } from '../types/modelOptimizers.js';

const MODEL_PATTERNS = {
  claude: {
    identifiers: [
      "claude",
      "anthropic",
      "sonnet",
      "opus",
      "haiku",
      "claude-3",
      "claude-4",
      "opus-4.1",
      "claude-instant",
    ],
    patterns: [
      /<thinking>/i,
      /<answer_quality>/i,
      /\bArtifact\b/i,
      /\bClaude\b/i,
      /Human:|Assistant:/,
      /\[THINKING\]/i,
    ],
    features: {
      supportsXML: true,
      supportsPrefilling: true,
      supportsThinkingTags: true,
      maxContextWindow: 200000,
      preferredStructure: "xml" as const,
    },
  },
  gpt: {
    identifiers: [
      "gpt",
      "openai",
      "chatgpt",
      "gpt-5",
      "gpt-4",
      "gpt-3.5",
      "turbo",
      "davinci",
      "o1",
      "o1-preview",
    ],
    patterns: [
      /system.*message/i,
      /function[_\s]calling/i,
      /response_format/i,
      /\btools\b.*\bfunction\b/i,
      /temperature.*top_p/i,
    ],
    features: {
      supportsSystemMessage: true,
      supportsFunctionCalling: true,
      supportsResponseFormat: true,
      maxContextWindow: 128000,
      preferredStructure: "json" as const,
    },
  },
  gemini: {
    identifiers: [
      "gemini",
      "google",
      "bard",
      "palm",
      "vertex",
      "gemini-pro",
      "gemini-ultra",
      "gemini-flash",
    ],
    patterns: [
      /safety[_\s]settings/i,
      /grounding/i,
      /context[_\s]caching/i,
      /harm[_\s]category/i,
      /\bgemini\b/i,
    ],
    features: {
      supportsGrounding: true,
      supportsContextCaching: true,
      supportsSafetySettings: true,
      maxContextWindow: 2000000,
      preferredStructure: "markdown" as const,
    },
  },
};

interface DetectModelParams {
  prompt?: string;
  model?: string;
  metadata?: any;
}

/**
 * Detects the target model from various inputs
 * @param {DetectModelParams} params - Detection parameters
 * @returns {ModelDetectionResult} Detection result with model info and confidence
 */
function detectModel({ prompt = "", model = "", metadata = {} }: DetectModelParams): ModelDetectionResult {
  // Build the result with all required properties
  let detectedModel: 'claude' | 'gpt' | 'gemini' | 'generic' = 'generic';
  let confidence = 0;
  const signals: string[] = [];
  const features = {
    supportsMarkdown: true,
    supportsJSON: true,
    preferredStructure: "markdown" as const
  };

  // Check explicit model specification first
  if (model) {
    const normalizedModel = model.toLowerCase();
    for (const [modelKey, config] of Object.entries(MODEL_PATTERNS)) {
      if (config.identifiers.some((id) => normalizedModel.includes(id))) {
        detectedModel = modelKey as 'claude' | 'gpt' | 'gemini';
        confidence = 1;
        signals.push(`explicit: ${model}`);
        return {
          model: detectedModel,
          confidence,
          signals,
          features: config.features
        };
      }
    }
  }

  // Check metadata for model hints
  if (metadata.model || metadata.provider || metadata.engine) {
    const metaModel = (
      metadata.model ||
      metadata.provider ||
      metadata.engine
    ).toLowerCase();
    for (const [modelKey, config] of Object.entries(MODEL_PATTERNS)) {
      if (config.identifiers.some((id) => metaModel.includes(id))) {
        detectedModel = modelKey as 'claude' | 'gpt' | 'gemini';
        confidence = 0.9;
        signals.push(`metadata: ${metaModel}`);
        return {
          model: detectedModel,
          confidence,
          signals,
          features: config.features
        };
      }
    }
  }

  // Pattern-based detection from prompt content
  const scores: Record<string, number> = {};

  for (const [modelKey, config] of Object.entries(MODEL_PATTERNS)) {
    scores[modelKey] = 0;

    // Check for identifier keywords
    const identifierMatches = config.identifiers.filter((id) =>
      prompt.toLowerCase().includes(id)
    );
    scores[modelKey] += identifierMatches.length * 0.3;

    if (identifierMatches.length > 0) {
      signals.push(
        `Found ${modelKey} identifiers: ${identifierMatches.join(", ")}`
      );
    }

    // Check for pattern matches
    const patternMatches = config.patterns.filter((pattern) =>
      pattern.test(prompt)
    );
    scores[modelKey] += patternMatches.length * 0.2;

    if (patternMatches.length > 0) {
      signals.push(
        `Matched ${modelKey} patterns: ${patternMatches.length} patterns`
      );
    }
  }

  // Find the highest scoring model
  let maxScore = 0;
  let bestModel = null;

  for (const [modelKey, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestModel = modelKey;
    }
  }

  if (bestModel && maxScore > 0.2) {
    detectedModel = bestModel as 'claude' | 'gpt' | 'gemini';
    confidence = Math.min(maxScore, 0.85);
    signals.push(`pattern-scores: ${JSON.stringify(scores)}`);
    const modelFeatures = MODEL_PATTERNS[bestModel]?.features || features;
    return {
      model: detectedModel,
      confidence,
      signals,
      features: modelFeatures
    };
  } else {
    // Default to generic if no specific model detected
    confidence = 0.3;
    signals.push(
      "No specific model detected, using generic optimization"
    );
    return {
      model: 'generic',
      confidence,
      signals,
      features
    };
  }
}

/**
 * Gets the feature set for a specific model
 * @param {string} modelName - The model name
 * @returns {ModelFeatures} Feature set for the model
 */
function getModelFeatures(modelName: string): ModelFeatures {
  const normalizedName = modelName.toLowerCase();

  for (const [modelKey, config] of Object.entries(MODEL_PATTERNS)) {
    if (config.identifiers.some((id) => normalizedName.includes(id))) {
      return config.features as ModelFeatures;
    }
  }

  return {
    supportsMarkdown: true,
    supportsJSON: true,
    preferredStructure: "markdown",
  };
}

/**
 * Determines if a specific optimization technique is suitable for a model
 * @param {string} technique - The optimization technique
 * @param {ModelFeatures} features - The model features object
 * @returns {boolean} Whether the technique is suitable
 */
function isTechniqueSuitable(technique: string, features: ModelFeatures): boolean {
  const techniqueRequirements = {
    xmlStructure: "supportsXML",
    thinkingTags: "supportsThinkingTags",
    prefilling: "supportsPrefilling",
    systemMessage: "supportsSystemMessage",
    functionCalling: "supportsFunctionCalling",
    responseFormat: "supportsResponseFormat",
    grounding: "supportsGrounding",
    contextCaching: "supportsContextCaching",
    safetySettings: "supportsSafetySettings",
  };

  const requirement = techniqueRequirements[technique];
  return requirement ? features[requirement] === true : true;
}

export {
  detectModel,
  getModelFeatures,
  isTechniqueSuitable,
  MODEL_PATTERNS
};
