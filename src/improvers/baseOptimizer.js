/**
 * Base Generic Prompt Optimizer
 * Universal improvements applicable to all LLM models
 */

/**
 * Applies base-level improvements to any prompt
 * @param {string} prompt - Original prompt
 * @param {Object} options - Optimization options
 * @returns {Object} Improved prompt with metadata
 */
function applyBaseImprovements(prompt, options = {}) {
  const improvements = [];
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
  if (options.includeExamples !== false) {
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
  const criteriaPrompt = addSuccessCriteria(improvedPrompt);
  if (criteriaPrompt !== improvedPrompt) {
    improvedPrompt = criteriaPrompt;
    improvements.push('Defined success criteria');
  }
  
  return {
    original: prompt,
    improved: improvedPrompt,
    improvements,
    baseScore: calculateBaseScore(improvedPrompt)
  };
}

/**
 * Enhances task clarity in the prompt
 */
function enhanceTaskClarity(prompt) {
  // Check if prompt already has clear task definition
  if (!/^(task:|objective:|goal:|purpose:)/im.test(prompt)) {
    // Extract likely task from first sentence or paragraph
    const lines = prompt.split('\n');
    const firstMeaningfulLine = lines.find(line => line.trim().length > 10);
    
    if (firstMeaningfulLine) {
      return `Task: ${firstMeaningfulLine}\n\n${prompt}`;
    }
  }
  
  return prompt;
}

/**
 * Improves the structural organization of the prompt
 */
function improveStructure(prompt) {
  // Check if prompt lacks clear structure
  const hasStructure = /#{1,3}\s|\*\*[^*]+\*\*|^\d+\.\s/m.test(prompt);
  
  if (!hasStructure && prompt.length > 200) {
    // Attempt to identify logical sections
    const sections = [];
    const paragraphs = prompt.split(/\n\n+/);
    
    if (paragraphs.length > 1) {
      // First paragraph as context/task
      sections.push(`## Task\n${paragraphs[0]}`);
      
      // Remaining as details
      if (paragraphs.length > 1) {
        sections.push(`## Details\n${paragraphs.slice(1).join('\n\n')}`);
      }
      
      return sections.join('\n\n');
    }
  }
  
  return prompt;
}

/**
 * Specifies input and output formats
 */
function specifyInputOutput(prompt) {
  const hasInputSpec = /input:|given:|provided:/i.test(prompt);
  const hasOutputSpec = /output:|return:|result:|response:/i.test(prompt);
  
  if (!hasInputSpec || !hasOutputSpec) {
    const additions = [];
    
    if (!hasInputSpec) {
      additions.push('\n## Input\nProvide the necessary input data or parameters.');
    }
    
    if (!hasOutputSpec) {
      additions.push('\n## Expected Output\nReturn the result in a clear, structured format.');
    }
    
    if (additions.length > 0) {
      return prompt + '\n' + additions.join('\n');
    }
  }
  
  return prompt;
}

/**
 * Adds context setting to the prompt
 */
function addContextSetting(prompt) {
  const hasContext = /context:|background:|scenario:|situation:/i.test(prompt);
  
  if (!hasContext && !prompt.includes('You are')) {
    const contextPrefix = 'Context: You are an AI assistant helping with the following task.\n\n';
    return contextPrefix + prompt;
  }
  
  return prompt;
}

/**
 * Defines operational constraints
 */
function defineConstraints(prompt) {
  const hasConstraints = /constraint:|limit:|must:|should:|require:/i.test(prompt);
  
  if (!hasConstraints) {
    const constraints = [
      '\n## Constraints',
      '- Provide accurate and helpful responses',
      '- Follow best practices and standards',
      '- Ensure clarity and completeness'
    ];
    
    return prompt + '\n' + constraints.join('\n');
  }
  
  return prompt;
}

/**
 * Integrates examples into the prompt
 */
function integrateExamples(prompt) {
  const hasExamples = /example:|e\.g\.|for instance|such as/i.test(prompt);
  
  if (!hasExamples && prompt.length < 1000) {
    const exampleSection = [
      '\n## Example',
      'Input: [Sample input]',
      'Output: [Expected output format]'
    ];
    
    return prompt + '\n' + exampleSection.join('\n');
  }
  
  return prompt;
}

/**
 * Adds error handling instructions
 */
function addErrorHandling(prompt) {
  const hasErrorHandling = /error:|exception:|invalid:|fail:|wrong:/i.test(prompt);
  
  if (!hasErrorHandling) {
    const errorSection = [
      '\n## Error Handling',
      'If any issues arise:',
      '- Identify the problem clearly',
      '- Suggest potential solutions',
      '- Provide alternative approaches if applicable'
    ];
    
    return prompt + '\n' + errorSection.join('\n');
  }
  
  return prompt;
}

/**
 * Adds success criteria to the prompt
 */
function addSuccessCriteria(prompt) {
  const hasCriteria = /success:|criteria:|complete:|achieve:|goal:/i.test(prompt);
  
  if (!hasCriteria) {
    const criteriaSection = [
      '\n## Success Criteria',
      'The response should:',
      '- Address all aspects of the task',
      '- Be clear and well-organized',
      '- Include relevant details and explanations'
    ];
    
    return prompt + '\n' + criteriaSection.join('\n');
  }
  
  return prompt;
}

/**
 * Calculates a base quality score for the improved prompt
 */
function calculateBaseScore(prompt) {
  let score = 50; // Base score
  
  // Structure indicators
  if (/#{1,3}\s/m.test(prompt)) score += 5;
  if (/^\d+\.\s/m.test(prompt)) score += 5;
  if (/\*\*[^*]+\*\*/m.test(prompt)) score += 3;
  
  // Content indicators
  if (/task:|objective:/i.test(prompt)) score += 5;
  if (/input:|output:/i.test(prompt)) score += 5;
  if (/example:/i.test(prompt)) score += 5;
  if (/constraint:|require:/i.test(prompt)) score += 5;
  if (/error|exception/i.test(prompt)) score += 5;
  if (/success|criteria/i.test(prompt)) score += 5;
  
  // Length and detail
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount > 50) score += 5;
  if (wordCount > 100) score += 5;
  
  return Math.min(score, 85);
}

/**
 * Analyzes prompt for improvement opportunities
 */
function analyzeImprovementOpportunities(prompt) {
  const opportunities = [];
  
  if (!/task:|objective:/i.test(prompt)) {
    opportunities.push({
      type: 'clarity',
      description: 'Add explicit task definition',
      impact: 'high'
    });
  }
  
  if (!/example:/i.test(prompt)) {
    opportunities.push({
      type: 'examples',
      description: 'Include concrete examples',
      impact: 'medium'
    });
  }
  
  if (!/#{1,3}\s|\*\*[^*]+\*\*/m.test(prompt)) {
    opportunities.push({
      type: 'structure',
      description: 'Improve structural organization',
      impact: 'medium'
    });
  }
  
  if (!/error|exception/i.test(prompt)) {
    opportunities.push({
      type: 'robustness',
      description: 'Add error handling instructions',
      impact: 'low'
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