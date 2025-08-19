/**
 * Base Generic Prompt Optimizer
 * Universal improvements applicable to all LLM models
 */

interface OptimizationOptions {
  includeExamples?: boolean;
  [key: string]: any;
}

interface ImprovementResult {
  prompt: string;
  improvements: string[];
  score?: number;
}

interface ImprovementOpportunity {
  type: string;
  description: string;
  impact: string;
}

/**
 * Applies base-level improvements to any prompt
 * @param {string} prompt - Original prompt
 * @param {Object} options - Optimization options
 * @returns {Object} Improved prompt with metadata
 */
function applyBaseImprovements(prompt: string, options: OptimizationOptions = {}): ImprovementResult {
  const improvements: string[] = [];
  let improvedPrompt = prompt;
  
  // 1. Task Clarity Enhancement
  improvedPrompt = enhanceTaskClarity(improvedPrompt);
  if (improvedPrompt !== prompt) {
    improvements.push('Enhanced task clarity with explicit objectives');
  }
  
  // 2. Structure Improvement
  const structuredPrompt = improveStructure(improvedPrompt);
  if (structuredPrompt !== improvedPrompt) {
    improvedPrompt = structuredPrompt;
    improvements.push('Added clear section structure');
  }
  
  // 3. Input/Output Specification
  const specifiedPrompt = specifyInputOutput(improvedPrompt);
  if (specifiedPrompt !== improvedPrompt) {
    improvedPrompt = specifiedPrompt;
    improvements.push('Clarified input/output specifications');
  }
  
  // 4. Context Setting
  const contextualPrompt = addContextSetting(improvedPrompt);
  if (contextualPrompt !== improvedPrompt) {
    improvedPrompt = contextualPrompt;
    improvements.push('Added context and background information');
  }
  
  // 5. Constraint Definition
  const constrainedPrompt = defineConstraints(improvedPrompt);
  if (constrainedPrompt !== improvedPrompt) {
    improvedPrompt = constrainedPrompt;
    improvements.push('Defined operational constraints');
  }
  
  // 6. Example Integration
  if (options.includeExamples) {
    const examplePrompt = integrateExamples(improvedPrompt);
    if (examplePrompt !== improvedPrompt) {
      improvedPrompt = examplePrompt;
      improvements.push('Added illustrative examples');
    }
  }
  
  // 7. Error Handling Instructions
  const errorHandledPrompt = addErrorHandling(improvedPrompt);
  if (errorHandledPrompt !== improvedPrompt) {
    improvedPrompt = errorHandledPrompt;
    improvements.push('Added error handling instructions');
  }
  
  // 8. Success Criteria
  const successPrompt = addSuccessCriteria(improvedPrompt);
  if (successPrompt !== improvedPrompt) {
    improvedPrompt = successPrompt;
    improvements.push('Defined success criteria');
  }
  
  return {
    prompt: improvedPrompt,
    improvements,
    score: calculateBaseScore(improvedPrompt)
  };
}

/**
 * Enhance task clarity with explicit objectives
 * @param {string} prompt - Original prompt
 * @returns {string} Enhanced prompt
 */
function enhanceTaskClarity(prompt: string): string {
  // Check if already has clear objectives
  if (prompt.includes('objective') || prompt.includes('goal')) {
    return prompt;
  }
  
  // Add objective header if missing
  return `## Objective
${prompt}

Please accomplish this task with attention to detail and accuracy.`;
}

/**
 * Improve prompt structure with clear sections
 * @param {string} prompt - Original prompt
 * @returns {string} Structured prompt
 */
function improveStructure(prompt: string): string {
  // Check if already well-structured
  const hasHeaders = /^#{1,3}\s+/m.test(prompt);
  const hasSections = prompt.split('\n\n').length > 2;
  
  if (hasHeaders && hasSections) {
    return prompt;
  }
  
  // Parse and structure the prompt
  const lines = prompt.split('\n');
  const sections: string[] = [];
  let currentSection: string[] = [];
  
  for (const line of lines) {
    if (line.trim() === '') {
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
        currentSection = [];
      }
    } else {
      currentSection.push(line);
    }
  }
  
  if (currentSection.length > 0) {
    sections.push(currentSection.join('\n'));
  }
  
  // Add appropriate headers
  if (sections.length === 1) {
    return `## Task Description
${sections[0]}`;
  }
  
  // Multi-section prompt
  return sections.map((section, i) => {
    if (i === 0 && !section.startsWith('#')) {
      return `## Overview\n${section}`;
    }
    return section;
  }).join('\n\n');
}

/**
 * Specify input and output requirements
 * @param {string} prompt - Original prompt
 * @returns {string} Prompt with specifications
 */
function specifyInputOutput(prompt: string): string {
  const hasInput = /input|data|provide|given/i.test(prompt);
  const hasOutput = /output|return|result|generate|create/i.test(prompt);
  
  const additions: string[] = [];
  
  if (!hasInput) {
    additions.push(`
## Input
Provide the necessary input data or parameters.`);
  }
  
  if (!hasOutput) {
    additions.push(`
## Expected Output
Return the result in a clear, structured format.`);
  }
  
  return additions.length > 0 ? prompt + '\n' + additions.join('\n') : prompt;
}

/**
 * Add context setting to prompt
 * @param {string} prompt - Original prompt
 * @returns {string} Contextualized prompt
 */
function addContextSetting(prompt: string): string {
  // Check if context already exists
  if (/context|background|scenario|assume/i.test(prompt)) {
    return prompt;
  }
  
  // Add generic context section
  return `## Context
This task should be completed with professional quality and attention to detail.

${prompt}`;
}

/**
 * Define operational constraints
 * @param {string} prompt - Original prompt
 * @returns {string} Prompt with constraints
 */
function defineConstraints(prompt: string): string {
  // Check if constraints already defined
  if (/constraint|limit|must|should|require/i.test(prompt)) {
    return prompt;
  }
  
  // Add constraint section
  return `${prompt}

## Constraints
- Follow best practices and industry standards
- Ensure accuracy and completeness
- Provide clear explanations where necessary`;
}

/**
 * Integrate examples into prompt
 * @param {string} prompt - Original prompt
 * @returns {string} Prompt with examples
 */
function integrateExamples(prompt: string): string {
  // Check if examples already exist
  if (/example|e\.g\.|for instance|such as/i.test(prompt)) {
    return prompt;
  }
  
  // Add example section
  return `${prompt}

## Examples
Consider similar scenarios and apply appropriate patterns and best practices.`;
}

/**
 * Add error handling instructions
 * @param {string} prompt - Original prompt
 * @returns {string} Prompt with error handling
 */
function addErrorHandling(prompt: string): string {
  // Check if error handling already mentioned
  if (/error|exception|handle|catch|fail/i.test(prompt)) {
    return prompt;
  }
  
  // Add error handling section
  return `${prompt}

## Error Handling
- Identify potential issues or edge cases
- Provide graceful error handling where applicable
- Include validation steps`;
}

/**
 * Add success criteria to prompt
 * @param {string} prompt - Original prompt
 * @returns {string} Prompt with success criteria
 */
function addSuccessCriteria(prompt: string): string {
  // Check if success criteria already defined
  if (/success|complete|done|achieve|criteri/i.test(prompt)) {
    return prompt;
  }
  
  // Add success criteria section
  return `${prompt}

## Success Criteria
- Task completed accurately and thoroughly
- All requirements addressed
- Clear and well-organized output`;
}

/**
 * Calculate a base score for the improved prompt
 * @param {string} prompt - Improved prompt
 * @returns {number} Score between 0-100
 */
function calculateBaseScore(prompt: string): number {
  let score = 50; // Base score
  
  // Structure scoring
  if (/^#{1,3}\s+/m.test(prompt)) score += 10;
  if (prompt.split('\n\n').length > 2) score += 5;
  
  // Content scoring
  if (/objective|goal/i.test(prompt)) score += 5;
  if (/input|output/i.test(prompt)) score += 5;
  if (/context|background/i.test(prompt)) score += 5;
  if (/constraint|require/i.test(prompt)) score += 5;
  if (/example/i.test(prompt)) score += 5;
  if (/error|exception/i.test(prompt)) score += 5;
  if (/success|criteri/i.test(prompt)) score += 5;
  
  return Math.min(100, score);
}

/**
 * Analyze improvement opportunities
 * @param {string} prompt - Original prompt
 * @returns {Array} List of improvement opportunities
 */
function analyzeImprovementOpportunities(prompt: string): ImprovementOpportunity[] {
  const opportunities: ImprovementOpportunity[] = [];
  
  // Check for missing elements
  if (!/objective|goal/i.test(prompt)) {
    opportunities.push({
      type: 'clarity',
      description: 'Add explicit objectives',
      impact: 'high'
    });
  }
  
  if (!/^#{1,3}\s+/m.test(prompt)) {
    opportunities.push({
      type: 'structure',
      description: 'Add section headers',
      impact: 'medium'
    });
  }
  
  if (!/example/i.test(prompt)) {
    opportunities.push({
      type: 'examples',
      description: 'Include concrete examples',
      impact: 'high'
    });
  }
  
  if (!/error|exception/i.test(prompt)) {
    opportunities.push({
      type: 'robustness',
      description: 'Add error handling instructions',
      impact: 'medium'
    });
  }
  
  return opportunities;
}

export {
  applyBaseImprovements,
  enhanceTaskClarity,
  improveStructure,
  specifyInputOutput,
  addContextSetting,
  defineConstraints,
  integrateExamples,
  addErrorHandling,
  addSuccessCriteria,
  calculateBaseScore,
  analyzeImprovementOpportunities
};