/**
 * Model Detection System
 * Identifies the target AI model from prompt content and metadata
 */

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
      preferredStructure: "xml",
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
      preferredStructure: "json",
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
      preferredStructure: "markdown",
    },
  },
};

/**
 * Detects the target model from various inputs
 * @param {Object} params - Detection parameters
 * @param {string} params.prompt - The prompt text to analyze
 * @param {string} [params.model] - Explicit model specification
 * @param {Object} [params.metadata] - Additional metadata
 * @returns {Object} Detection result with model info and confidence
 */
function detectModel({ prompt = "", model = "", metadata = {} }) {
  const results = {
    detectedModel: null,
    confidence: 0,
    features: {},
    reasoning: [],
  };

  // Check explicit model specification first
  if (model) {
    const normalizedModel = model.toLowerCase();
    for (const [modelKey, config] of Object.entries(MODEL_PATTERNS)) {
      if (config.identifiers.some((id) => normalizedModel.includes(id))) {
        results.detectedModel = modelKey;
        results.confidence = 0.95;
        results.features = config.features;
        results.reasoning.push(`Explicit model specification: ${model}`);
        return results;
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
        results.detectedModel = modelKey;
        results.confidence = 0.9;
        results.features = config.features;
        results.reasoning.push(`Metadata indicates: ${metaModel}`);
        return results;
      }
    }
  }

  // Pattern-based detection from prompt content
  const scores = {};

  for (const [modelKey, config] of Object.entries(MODEL_PATTERNS)) {
    scores[modelKey] = 0;

    // Check for identifier keywords
    const identifierMatches = config.identifiers.filter((id) =>
      prompt.toLowerCase().includes(id)
    );
    scores[modelKey] += identifierMatches.length * 0.3;

    if (identifierMatches.length > 0) {
      results.reasoning.push(
        `Found ${modelKey} identifiers: ${identifierMatches.join(", ")}`
      );
    }

    // Check for pattern matches
    const patternMatches = config.patterns.filter((pattern) =>
      pattern.test(prompt)
    );
    scores[modelKey] += patternMatches.length * 0.2;

    if (patternMatches.length > 0) {
      results.reasoning.push(
        `Matched ${modelKey} patterns: ${patternMatches.length} patterns`
      );
    }
  }

  // Find the highest scoring model
  let maxScore = 0;
  let detectedModel = null;

  for (const [modelKey, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedModel = modelKey;
    }
  }

  if (detectedModel && maxScore > 0.2) {
    results.detectedModel = detectedModel;
    results.confidence = Math.min(maxScore, 0.85);
    results.features = MODEL_PATTERNS[detectedModel].features;
  } else {
    // Default to generic optimization if no specific model detected
    results.detectedModel = "generic";
    results.confidence = 0.3;
    results.features = {
      supportsMarkdown: true,
      supportsJSON: true,
      preferredStructure: "markdown",
    };
    results.reasoning.push(
      "No specific model detected, using generic optimization"
    );
  }

  return results;
}

/**
 * Gets the feature set for a specific model
 * @param {string} modelName - The model name
 * @returns {Object} Feature set for the model
 */
function getModelFeatures(modelName) {
  const normalizedName = modelName.toLowerCase();

  for (const [modelKey, config] of Object.entries(MODEL_PATTERNS)) {
    if (config.identifiers.some((id) => normalizedName.includes(id))) {
      return config.features;
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
 * @param {string} model - The model name
 * @param {string} technique - The optimization technique
 * @returns {boolean} Whether the technique is suitable
 */
function isTechniqueSuitable(model, technique) {
  const features = getModelFeatures(model);

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

module.exports = {
  detectModel,
  getModelFeatures,
  isTechniqueSuitable,
  MODEL_PATTERNS,
};
