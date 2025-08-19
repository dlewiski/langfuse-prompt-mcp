export const toolDefinitions = [
  {
    name: 'track',
    description: 'Track a prompt to Langfuse for history and analysis',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt to track' },
        category: { type: 'string', description: 'Optional category' },
        metadata: { 
          type: 'object', 
          description: 'Optional metadata',
          properties: {
            wordCount: { type: 'number' },
            complexity: { type: 'string' },
            hasCode: { type: 'boolean' },
            frameworks: { type: 'array', items: { type: 'string' } },
          }
        },
        quickScore: { type: 'number', description: 'Optional quick score 0-100' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'evaluate',
    description: 'Evaluate a prompt on 10 criteria and get improvement recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt to evaluate' },
        promptId: { type: 'string', description: 'Optional Langfuse prompt ID' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'improve',
    description: 'Generate an improved version of a prompt with model-specific optimizations',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt to improve' },
        promptId: { type: 'string', description: 'Optional Langfuse prompt ID' },
        techniques: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific techniques to apply',
        },
        targetModel: {
          type: 'string',
          description: 'Target model for optimization (claude, gpt, gemini)',
          enum: ['claude', 'gpt', 'gemini'],
        },
        enableModelOptimization: {
          type: 'boolean',
          description: 'Enable model-specific optimizations',
          default: true,
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'compare',
    description: 'Compare two prompt versions',
    inputSchema: {
      type: 'object',
      properties: {
        prompt1: { type: 'string', description: 'First prompt version' },
        prompt2: { type: 'string', description: 'Second prompt version' },
        promptId: { type: 'string', description: 'Optional Langfuse prompt ID' },
      },
      required: ['prompt1', 'prompt2'],
    },
  },
  {
    name: 'patterns',
    description: 'Extract patterns from high-scoring prompts in Langfuse',
    inputSchema: {
      type: 'object',
      properties: {
        minScore: { type: 'number', description: 'Minimum score threshold', default: 85 },
        limit: { type: 'number', description: 'Number of prompts to analyze', default: 100 },
      },
    },
  },
  {
    name: 'deploy',
    description: 'Deploy a prompt version to production',
    inputSchema: {
      type: 'object',
      properties: {
        promptId: { type: 'string', description: 'Prompt ID' },
        version: { type: 'string', description: 'Version to deploy' },
        label: { type: 'string', description: 'Deployment label', default: 'production' },
      },
      required: ['promptId', 'version'],
    },
  },
  {
    name: 'save',
    description: 'Save an improved prompt to a markdown file',
    inputSchema: {
      type: 'object',
      properties: {
        originalPrompt: { type: 'string', description: 'The original prompt text' },
        improvedPrompt: { type: 'string', description: 'The improved prompt text' },
        originalScore: { type: 'number', description: 'Original prompt score' },
        improvedScore: { type: 'number', description: 'Improved prompt score' },
        techniquesApplied: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of techniques that were applied'
        },
        filename: { type: 'string', description: 'Optional filename for saving' }
      },
      required: ['originalPrompt', 'improvedPrompt'],
    },
  },
];