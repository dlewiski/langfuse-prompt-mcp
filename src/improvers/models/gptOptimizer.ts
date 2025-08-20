/**
 * GPT-Specific Prompt Optimizer
 * Optimizations tailored for OpenAI's GPT models
 */

import type { GPTOptimizerOptions, OptimizerResult } from '../../types/modelOptimizers.js';

/**
 * Applies GPT-specific optimizations to a prompt
 * @param {string} prompt - Base-improved prompt
 * @param {GPTOptimizerOptions} options - GPT-specific options
 * @returns {OptimizerResult} GPT-optimized prompt with metadata
 */
function optimizeForGPT(prompt: string, options: GPTOptimizerOptions = {}): OptimizerResult {
  const optimizations = [];
  let optimizedPrompt = prompt;
  
  // 1. System Message Optimization
  const systemOptimized = createSystemMessage(optimizedPrompt, options);
  if (systemOptimized.changed) {
    optimizedPrompt = systemOptimized.prompt;
    optimizations.push('Created optimized system message');
  }
  
  // 2. Response Format Schema
  if (options.structuredOutput !== false) {
    const formatOptimized = addResponseFormat(optimizedPrompt, options);
    if (formatOptimized !== optimizedPrompt) {
      optimizedPrompt = formatOptimized;
      optimizations.push('Added JSON response format schema');
    }
  }
  
  // 3. Few-Shot Learning Examples
  if (options.includeFewShot !== false && !hasExamples(prompt)) {
    const fewShotPrompt = addFewShotExamples(optimizedPrompt, options);
    if (fewShotPrompt !== optimizedPrompt) {
      optimizedPrompt = fewShotPrompt;
      optimizations.push('Added few-shot learning examples');
    }
  }
  
  // 4. Function Calling Structure
  if (options.enableFunctions || detectFunctionNeed(prompt)) {
    const functionPrompt = addFunctionCallingStructure(optimizedPrompt);
    if (functionPrompt !== optimizedPrompt) {
      optimizedPrompt = functionPrompt;
      optimizations.push('Added function calling structure');
    }
  }
  
  // 5. Temperature and Parameter Hints
  const parameterized = addParameterHints(optimizedPrompt, options);
  if (parameterized.changed) {
    optimizedPrompt = parameterized.prompt;
    optimizations.push('Added parameter optimization hints');
  }
  
  // 6. Chain of Thought for o1 Models
  if (options.model && options.model.includes('o1')) {
    const reasoningPrompt = addO1Reasoning(optimizedPrompt);
    if (reasoningPrompt !== optimizedPrompt) {
      optimizedPrompt = reasoningPrompt;
      optimizations.push('Added o1 model reasoning structure');
    }
  }
  
  // 7. Token Optimization
  const tokenOptimized = optimizeTokenUsage(optimizedPrompt);
  if (tokenOptimized !== optimizedPrompt) {
    optimizedPrompt = tokenOptimized;
    optimizations.push('Optimized for token efficiency');
  }
  
  return {
    optimizedPrompt,
    optimizations,
    metadata: {
      model: 'gpt',
      features: {
        hasSystemMessage: true,
        hasResponseFormat: options.structuredOutput !== false,
        hasFewShot: options.includeFewShot !== false,
        hasFunctionCalling: options.enableFunctions || detectFunctionNeed(prompt)
      },
      parameters: parameterized.parameters
    }
  };
}

/**
 * Creates an optimized system message
 */
function createSystemMessage(prompt: string, _options: GPTOptimizerOptions): { prompt: string; changed: boolean } {
  // Check if already formatted as system/user messages
  if (prompt.includes('"role": "system"') || prompt.startsWith('System:')) {
    return { prompt, changed: false };
  }
  
  // Extract role/context information for system message
  let systemContent = '';
  let userContent = prompt;
  
  // Extract role definition
  const roleMatch = prompt.match(/^(?:You are|Role:|Context:)\s*(.+?)(?:\n|$)/im);
  if (roleMatch) {
    systemContent = roleMatch[1].trim();
    userContent = prompt.replace(roleMatch[0], '').trim();
  }
  
  // Extract general instructions
  const instructionPatterns = [
    /^(?:Instructions?|Guidelines?|Rules?):\s*([\s\S]+?)(?=\n\n|\n#|$)/im,
    /^(?:Always|Never|Must|Should)\s+.+$/gm
  ];
  
  for (const pattern of instructionPatterns) {
    const match = userContent.match(pattern);
    if (match) {
      systemContent += '\n\n' + match[0];
      userContent = userContent.replace(match[0], '').trim();
    }
  }
  
  if (systemContent) {
    const formattedPrompt = {
      messages: [
        {
          role: "system",
          content: systemContent.trim()
        },
        {
          role: "user",
          content: userContent.trim()
        }
      ]
    };
    
    return {
      prompt: JSON.stringify(formattedPrompt, null, 2),
      changed: true
    };
  }
  
  return { prompt, changed: false };
}

/**
 * Adds response format schema for structured outputs
 */
function addResponseFormat(prompt: string, _options: GPTOptimizerOptions): string {
  // Detect what kind of output is expected
  const outputIndicators = {
    json: /json|object|dictionary|data structure/i,
    list: /list|array|items|elements/i,
    code: /code|function|class|script/i,
    analysis: /analysis|report|assessment|evaluation/i
  };
  
  let detectedFormat = null;
  for (const [format, pattern] of Object.entries(outputIndicators)) {
    if (pattern.test(prompt)) {
      detectedFormat = format;
      break;
    }
  }
  
  if (detectedFormat) {
    const schemas = {
      json: {
        type: "json_object",
        schema: {
          type: "object",
          properties: {
            result: { type: "string" },
            details: { type: "object" },
            metadata: { type: "object" }
          }
        }
      },
      list: {
        type: "json_object",
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { type: "string" }
            },
            count: { type: "number" }
          }
        }
      },
      code: {
        type: "json_object",
        schema: {
          type: "object",
          properties: {
            code: { type: "string" },
            language: { type: "string" },
            explanation: { type: "string" }
          }
        }
      },
      analysis: {
        type: "json_object",
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            findings: { type: "array" },
            recommendations: { type: "array" },
            conclusion: { type: "string" }
          }
        }
      }
    };
    
    const responseFormat = schemas[detectedFormat];
    if (responseFormat) {
      const formatSection = `\n\nResponse Format:\n${JSON.stringify(responseFormat, null, 2)}`;
      return prompt + formatSection;
    }
  }
  
  return prompt;
}

/**
 * Adds few-shot learning examples
 */
function addFewShotExamples(prompt: string, _options: GPTOptimizerOptions): string {
  const exampleFormat = `
## Examples

Example 1:
User: [Input example 1]
Assistant: [Output example 1]

Example 2:
User: [Input example 2]
Assistant: [Output example 2]

Now, for your task:`;
  
  return prompt + '\n' + exampleFormat;
}

/**
 * Adds function calling structure
 */
function addFunctionCallingStructure(prompt: string): string {
  const functionTemplate = `
## Available Functions

You have access to the following functions:

\`\`\`json
{
  "name": "process_data",
  "description": "Process the input data according to requirements",
  "parameters": {
    "type": "object",
    "properties": {
      "input": {
        "type": "string",
        "description": "The input to process"
      },
      "options": {
        "type": "object",
        "description": "Processing options"
      }
    },
    "required": ["input"]
  }
}
\`\`\`

Use these functions when appropriate to complete the task.`;
  
  return prompt + '\n' + functionTemplate;
}

/**
 * Adds parameter optimization hints
 */
function addParameterHints(prompt: string, _options: GPTOptimizerOptions): { prompt: string; changed: boolean; parameters?: any } {
  const complexity = detectComplexity(prompt);
  
  const parameters = {
    temperature: complexity > 0.7 ? 0.7 : 0.5,
    top_p: 0.9,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  };
  
  // Adjust based on task type
  if (prompt.toLowerCase().includes('creative') || prompt.toLowerCase().includes('generate ideas')) {
    parameters.temperature = 0.8;
    parameters.top_p = 0.95;
  } else if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('evaluate')) {
    parameters.temperature = 0.3;
    parameters.top_p = 0.85;
  }
  
  const hintSection = `
## Recommended Parameters
- Temperature: ${parameters.temperature} (${parameters.temperature > 0.6 ? 'creative' : 'focused'} output)
- Top-p: ${parameters.top_p}
- Best for: ${complexity > 0.7 ? 'complex reasoning' : 'straightforward tasks'}`;
  
  return {
    prompt: prompt + '\n' + hintSection,
    changed: true,
    parameters
  };
}

/**
 * Adds o1 model specific reasoning structure
 */
function addO1Reasoning(prompt) {
  const reasoningStructure = `
## Reasoning Process

1. **Understanding**: First, fully understand the problem and requirements
2. **Planning**: Develop a step-by-step approach to solve the problem
3. **Execution**: Work through each step methodically
4. **Verification**: Check the solution for correctness and completeness
5. **Optimization**: Consider if there are better approaches

Show your reasoning process as you work through the problem.`;
  
  return prompt + '\n' + reasoningStructure;
}

/**
 * Optimizes token usage for GPT models
 */
function optimizeTokenUsage(prompt: string): string {
  // Remove redundant whitespace
  let optimized = prompt.replace(/\n{3,}/g, '\n\n');
  
  // Compress verbose phrases
  const compressions = {
    'In order to': 'To',
    'Due to the fact that': 'Because',
    'In the event that': 'If',
    'At this point in time': 'Now',
    'For the purpose of': 'To'
  };
  
  for (const [verbose, concise] of Object.entries(compressions)) {
    optimized = optimized.replace(new RegExp(verbose, 'gi'), concise);
  }
  
  return optimized;
}

/**
 * Detects if the prompt needs function calling
 */
function detectFunctionNeed(prompt: string): boolean {
  const functionKeywords = [
    'calculate', 'process', 'fetch', 'retrieve', 'update',
    'query', 'search', 'api', 'database', 'external'
  ];
  
  const promptLower = prompt.toLowerCase();
  return functionKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Checks if prompt already has examples
 */
function hasExamples(prompt: string): boolean {
  return /example:|e\.g\.|for instance|such as/i.test(prompt);
}

/**
 * Detects complexity level of the prompt
 */
function detectComplexity(prompt: string): number {
  let complexity = 0;
  
  // Length-based complexity
  if (prompt.length > 500) complexity += 0.2;
  if (prompt.length > 1000) complexity += 0.2;
  
  // Task complexity keywords
  const complexKeywords = ['analyze', 'evaluate', 'design', 'optimize', 'comprehensive'];
  const promptLower = prompt.toLowerCase();
  
  for (const keyword of complexKeywords) {
    if (promptLower.includes(keyword)) {
      complexity += 0.15;
    }
  }
  
  // Multiple steps or requirements
  const steps = (prompt.match(/\d+\./g) || []).length;
  if (steps > 3) complexity += 0.2;
  
  return Math.min(complexity, 1.0);
}

/**
 * Creates GPT-specific example format
 */
function createGPTExample(input: string, output: string): string {
  return JSON.stringify({
    messages: [
      { role: "user", content: input },
      { role: "assistant", content: output }
    ]
  }, null, 2);
}

export {
  optimizeForGPT,
  createSystemMessage,
  addResponseFormat,
  addFewShotExamples,
  addFunctionCallingStructure,
  addParameterHints,
  addO1Reasoning,
  optimizeTokenUsage,
  detectFunctionNeed,
  detectComplexity,
  createGPTExample
};