/**
 * Claude-Specific Prompt Optimizer
 * Optimizations tailored for Anthropic's Claude models
 */

import type { ClaudeOptimizerOptions, OptimizerResult } from '../../types/modelOptimizers.js';

/**
 * Applies Claude-specific optimizations to a prompt
 * @param {string} prompt - Base-improved prompt
 * @param {ClaudeOptimizerOptions} options - Claude-specific options
 * @returns {OptimizerResult} Claude-optimized prompt with metadata
 */
function optimizeForClaude(prompt: string, options: ClaudeOptimizerOptions = {}): OptimizerResult {
  const optimizations = [];
  let optimizedPrompt = prompt;
  
  // 1. XML Structure Transformation
  const xmlPrompt = transformToXMLStructure(optimizedPrompt);
  if (xmlPrompt !== optimizedPrompt) {
    optimizedPrompt = xmlPrompt;
    optimizations.push('Converted to XML structure for better parsing');
  }
  
  // 2. Add Thinking Tags for Complex Reasoning
  if (options.complexity === 'high' || detectComplexity(prompt) > 0.7) {
    const thinkingPrompt = addThinkingTags(optimizedPrompt);
    if (thinkingPrompt !== optimizedPrompt) {
      optimizedPrompt = thinkingPrompt;
      optimizations.push('Added thinking tags for chain-of-thought reasoning');
    }
  }
  
  // 3. Prefilling Optimization
  if (options.enablePrefilling !== false) {
    const prefilledPrompt = addPrefillOptimization(optimizedPrompt);
    if (prefilledPrompt !== optimizedPrompt) {
      optimizedPrompt = prefilledPrompt;
      optimizations.push('Added prefilling hints for response structure');
    }
  }
  
  // 4. Constitutional AI Alignment
  const alignedPrompt = addConstitutionalAlignment(optimizedPrompt);
  if (alignedPrompt !== optimizedPrompt) {
    optimizedPrompt = alignedPrompt;
    optimizations.push('Added constitutional AI alignment principles');
  }
  
  // 5. Artifact Generation Support
  if (options.generateArtifacts || detectArtifactNeed(prompt)) {
    const artifactPrompt = addArtifactSupport(optimizedPrompt);
    if (artifactPrompt !== optimizedPrompt) {
      optimizedPrompt = artifactPrompt;
      optimizations.push('Added artifact generation instructions');
    }
  }
  
  // 6. Role and Perspective Setting
  const rolePrompt = enhanceRoleSetting(optimizedPrompt);
  if (rolePrompt !== optimizedPrompt) {
    optimizedPrompt = rolePrompt;
    optimizations.push('Enhanced role and perspective clarity');
  }
  
  // 7. Response Quality Tags
  const qualityPrompt = addQualityTags(optimizedPrompt);
  if (qualityPrompt !== optimizedPrompt) {
    optimizedPrompt = qualityPrompt;
    optimizations.push('Added response quality indicators');
  }
  
  return {
    optimizedPrompt,
    optimizations,
    metadata: {
      model: 'claude',
      features: {
        usesXML: true,
        usesThinking: options.complexity === 'high',
        usesPrefilling: options.enablePrefilling !== false,
        usesArtifacts: options.generateArtifacts || detectArtifactNeed(prompt)
      }
    }
  };
}

/**
 * Transforms prompt to XML structure
 */
function transformToXMLStructure(prompt) {
  // Skip if already has XML structure
  if (/<[^>]+>.*<\/[^>]+>/s.test(prompt)) {
    return prompt;
  }
  
  const sections = [];
  let workingPrompt = prompt;
  
  // Detect if this is a troubleshooting/debugging prompt
  const isTroubleshooting = /(?:not seeing|not working|issue|problem|error|concern|troubleshoot|debug|fix)/i.test(prompt);
  const hasLogs = /(?:logs?|output|console|trace|stack)/i.test(prompt);
  
  if (isTroubleshooting) {
    // Extract the problem statement
    const problemMatch = prompt.match(/^(.+?)(?:\.|:|\n)/);
    if (problemMatch) {
      sections.push(`<problem>\n${problemMatch[1].trim()}\n</problem>`);
      workingPrompt = workingPrompt.replace(problemMatch[0], '');
    }
    
    // Extract logs or debug output
    if (hasLogs) {
      const logsMatch = workingPrompt.match(/(?:logs?|output):\s*([\s\S]+?)(?=\n\n|$)/i);
      if (logsMatch) {
        sections.push(`<diagnostic_data>\n${logsMatch[1].trim()}\n</diagnostic_data>`);
        workingPrompt = workingPrompt.replace(logsMatch[0], '');
      } else if (workingPrompt.includes('|')) {
        // Likely contains formatted log output
        const lines = workingPrompt.split('\n');
        const logLines = lines.filter(line => line.includes('|'));
        if (logLines.length > 0) {
          sections.push(`<logs>\n${logLines.join('\n')}\n</logs>`);
          // Remove log lines from working prompt
          logLines.forEach(line => {
            workingPrompt = workingPrompt.replace(line, '');
          });
        }
      }
    }
    
    // Add investigation context
    sections.push(`<investigation_needed>
1. Verify connectivity and configuration
2. Check error logs and debug output
3. Test individual components
4. Identify root cause
5. Implement and verify solution
</investigation_needed>`);
    
    // Add remaining content as additional context
    const remaining = workingPrompt.trim();
    if (remaining && remaining.length > 10) {
      sections.push(`<additional_context>\n${remaining}\n</additional_context>`);
    }
  } else {
    // Original logic for non-troubleshooting prompts
    // Extract and structure the task
    const taskMatch = workingPrompt.match(/^(?:Task|Objective|Goal):\s*(.+?)(?:\n|$)/im);
    if (taskMatch) {
      sections.push(`<task>\n${taskMatch[1].trim()}\n</task>`);
      workingPrompt = workingPrompt.replace(taskMatch[0], '');
    }
    
    // Extract and structure context
    const contextMatch = workingPrompt.match(/(?:Context|Background|Scenario):\s*(.+?)(?:\n\n|$)/is);
    if (contextMatch) {
      sections.push(`<context>\n${contextMatch[1].trim()}\n</context>`);
      workingPrompt = workingPrompt.replace(contextMatch[0], '');
    }
    
    // Extract and structure requirements
    const requirementsMatch = workingPrompt.match(/(?:## Requirements?|Requirements?:)([\s\S]+?)(?=\n##|\n\n|$)/i);
    if (requirementsMatch) {
      sections.push(`<requirements>\n${requirementsMatch[1].trim()}\n</requirements>`);
      workingPrompt = workingPrompt.replace(requirementsMatch[0], '');
    }
    
    // Extract and structure constraints
    const constraintsMatch = workingPrompt.match(/(?:## Constraints?|Constraints?:)([\s\S]+?)(?=\n##|\n\n|$)/i);
    if (constraintsMatch) {
      sections.push(`<constraints>\n${constraintsMatch[1].trim()}\n</constraints>`);
      workingPrompt = workingPrompt.replace(constraintsMatch[0], '');
    }
    
    // Extract and structure examples
    const examplesMatch = workingPrompt.match(/(?:## Examples?|Examples?:)([\s\S]+?)(?=\n##|\n\n|$)/i);
    if (examplesMatch) {
      const examples = examplesMatch[1].trim();
      sections.push(`<examples>\n${formatExamplesAsXML(examples)}\n</examples>`);
      workingPrompt = workingPrompt.replace(examplesMatch[0], '');
    }
    
    // Extract and structure output format
    const outputMatch = workingPrompt.match(/(?:## (?:Expected )?Output|Output Format:)([\s\S]+?)(?=\n##|\n\n|$)/i);
    if (outputMatch) {
      sections.push(`<output_format>\n${outputMatch[1].trim()}\n</output_format>`);
      workingPrompt = workingPrompt.replace(outputMatch[0], '');
    }
    
    // Add any remaining content as instructions
    const remaining = workingPrompt.trim();
    if (remaining && remaining.length > 20) {
      sections.push(`<instructions>\n${remaining}\n</instructions>`);
    }
  }
  
  return sections.join('\n\n');
}

/**
 * Adds thinking tags for complex reasoning
 */
function addThinkingTags(prompt) {
  if (prompt.includes('<thinking>')) {
    return prompt;
  }
  
  const thinkingInstructions = `
<thinking_process>
Before providing your response, work through the problem step by step:
1. Understand the requirements and constraints
2. Consider different approaches and their trade-offs
3. Identify potential edge cases or challenges
4. Formulate a comprehensive solution
</thinking_process>

<response_structure>
Begin your response with <thinking> tags to show your reasoning process, then provide the final answer.
</response_structure>`;
  
  return prompt + '\n' + thinkingInstructions;
}

/**
 * Adds prefilling optimization hints
 */
function addPrefillOptimization(prompt: string): string {
  const prefillHints = `
<assistant_response_start>
I'll help you with this task. Let me break down the approach:
</assistant_response_start>`;
  
  return prompt + '\n' + prefillHints;
}

/**
 * Adds constitutional AI alignment principles
 */
function addConstitutionalAlignment(prompt) {
  if (prompt.includes('helpful') && prompt.includes('honest')) {
    return prompt;
  }
  
  const alignment = `
<principles>
- Be helpful, harmless, and honest in your response
- Provide accurate and reliable information
- Consider ethical implications of the solution
- Maintain objectivity and avoid bias
</principles>`;
  
  return prompt + '\n' + alignment;
}

/**
 * Adds artifact generation support
 */
function addArtifactSupport(prompt) {
  const artifactInstructions = `
<artifact_generation>
If the response includes code, configurations, or substantial structured content:
- Present it as a complete, runnable artifact
- Include all necessary imports and dependencies
- Add helpful comments and documentation
- Ensure the artifact is self-contained and functional
</artifact_generation>`;
  
  return prompt + '\n' + artifactInstructions;
}

/**
 * Enhances role and perspective setting
 */
function enhanceRoleSetting(prompt) {
  if (!prompt.includes('You are') && !prompt.includes('<role>')) {
    const roleSection = `<role>
You are an expert assistant with deep knowledge in the relevant domain.
Apply best practices and industry standards in your response.
</role>\n\n`;
    
    return roleSection + prompt;
  }
  
  return prompt;
}

/**
 * Adds response quality tags
 */
function addQualityTags(prompt) {
  const qualitySection = `
<answer_quality>
Ensure your response is:
- Comprehensive and addresses all aspects
- Well-structured and easy to follow
- Technically accurate and practical
- Includes relevant examples where helpful
</answer_quality>`;
  
  return prompt + '\n' + qualitySection;
}

/**
 * Formats examples as XML
 */
function formatExamplesAsXML(examplesText) {
  const lines = examplesText.split('\n');
  const formattedExamples = [];
  let currentExample = [];
  let exampleCount = 1;
  
  for (const line of lines) {
    if (line.match(/^(Input|Example|Case):/i)) {
      if (currentExample.length > 0) {
        formattedExamples.push(`<example_${exampleCount}>\n${currentExample.join('\n')}\n</example_${exampleCount}>`);
        exampleCount++;
        currentExample = [];
      }
    }
    currentExample.push(line);
  }
  
  if (currentExample.length > 0) {
    formattedExamples.push(`<example_${exampleCount}>\n${currentExample.join('\n')}\n</example_${exampleCount}>`);
  }
  
  return formattedExamples.join('\n');
}

/**
 * Detects if the prompt is complex enough to need thinking tags
 */
function detectComplexity(prompt) {
  let complexity = 0;
  
  // Keywords indicating complexity
  const complexKeywords = [
    'analyze', 'design', 'architect', 'optimize', 'algorithm',
    'system', 'complex', 'multiple', 'comprehensive', 'detailed'
  ];
  
  const promptLower = prompt.toLowerCase();
  for (const keyword of complexKeywords) {
    if (promptLower.includes(keyword)) {
      complexity += 0.1;
    }
  }
  
  // Length indicates complexity
  if (prompt.length > 500) complexity += 0.2;
  if (prompt.length > 1000) complexity += 0.2;
  
  // Multiple requirements or steps
  const listItems = (prompt.match(/^\s*[-*•]\s/gm) || []).length;
  if (listItems > 3) complexity += 0.2;
  
  return Math.min(complexity, 1.0);
}

/**
 * Detects if artifacts should be generated
 */
function detectArtifactNeed(prompt) {
  const artifactKeywords = [
    'code', 'function', 'class', 'component', 'script',
    'configuration', 'yaml', 'json', 'implement', 'create'
  ];
  
  const promptLower = prompt.toLowerCase();
  return artifactKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Creates Claude-specific example format
 */
function createClaudeExample(input, output) {
  return `<example>
<input>${input}</input>
<output>${output}</output>
</example>`;
}

export {
  optimizeForClaude,
  transformToXMLStructure,
  addThinkingTags,
  addPrefillOptimization,
  addConstitutionalAlignment,
  addArtifactSupport,
  enhanceRoleSetting,
  addQualityTags,
  detectComplexity,
  detectArtifactNeed,
  createClaudeExample
};