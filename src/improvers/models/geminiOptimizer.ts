/**
 * Gemini-Specific Prompt Optimizer
 * Optimizations tailored for Google's Gemini models
 */

import type { GeminiOptimizerOptions, OptimizerResult } from '../../types/modelOptimizers.js';

/**
 * Applies Gemini-specific optimizations to a prompt
 * @param {string} prompt - Base-improved prompt
 * @param {GeminiOptimizerOptions} options - Gemini-specific options
 * @returns {OptimizerResult} Gemini-optimized prompt with metadata
 */
function optimizeForGemini(prompt: string, options: GeminiOptimizerOptions = {}): OptimizerResult {
  const optimizations = [];
  let optimizedPrompt = prompt;
  
  // 1. Safety Settings Configuration
  const safetyOptimized = addSafetyConfiguration(optimizedPrompt, options);
  if (safetyOptimized.changed) {
    optimizedPrompt = safetyOptimized.prompt;
    optimizations.push('Added safety settings configuration');
  }
  
  // 2. Grounding and Citations
  if (options.enableGrounding !== false) {
    const groundedPrompt = addGroundingInstructions(optimizedPrompt);
    if (groundedPrompt !== optimizedPrompt) {
      optimizedPrompt = groundedPrompt;
      optimizations.push('Added grounding and citation instructions');
    }
  }
  
  // 3. Context Caching Strategy
  if (options.useContextCaching !== false && isLongContext(prompt)) {
    const cachedPrompt = optimizeForContextCaching(optimizedPrompt);
    if (cachedPrompt !== optimizedPrompt) {
      optimizedPrompt = cachedPrompt;
      optimizations.push('Optimized for context caching');
    }
  }
  
  // 4. Multi-Modal Considerations
  if (options.multiModal || detectMultiModalNeed(prompt)) {
    const multiModalPrompt = addMultiModalSupport(optimizedPrompt);
    if (multiModalPrompt !== optimizedPrompt) {
      optimizedPrompt = multiModalPrompt;
      optimizations.push('Added multi-modal processing support');
    }
  }
  
  // 5. Multi-Turn Coherence
  if (options.multiTurn) {
    const coherentPrompt = enhanceMultiTurnCoherence(optimizedPrompt);
    if (coherentPrompt !== optimizedPrompt) {
      optimizedPrompt = coherentPrompt;
      optimizations.push('Enhanced multi-turn conversation coherence');
    }
  }
  
  // 6. Code Execution Support
  if (detectCodeExecutionNeed(prompt)) {
    const codePrompt = addCodeExecutionSupport(optimizedPrompt);
    if (codePrompt !== optimizedPrompt) {
      optimizedPrompt = codePrompt;
      optimizations.push('Added code execution support');
    }
  }
  
  // 7. Markdown Optimization
  const markdownPrompt = optimizeMarkdownStructure(optimizedPrompt);
  if (markdownPrompt !== optimizedPrompt) {
    optimizedPrompt = markdownPrompt;
    optimizations.push('Optimized markdown structure for Gemini');
  }
  
  return {
    optimizedPrompt,
    optimizations,
    metadata: {
      model: 'gemini',
      features: {
        hasSafetySettings: true,
        hasGrounding: options.enableGrounding !== false,
        hasContextCaching: options.useContextCaching !== false && isLongContext(prompt),
        hasMultiModal: options.multiModal || detectMultiModalNeed(prompt),
        hasCodeExecution: detectCodeExecutionNeed(prompt)
      },
      configuration: safetyOptimized.configuration
    }
  };
}

/**
 * Adds safety configuration for Gemini
 */
function addSafetyConfiguration(prompt: string, _options: GeminiOptimizerOptions): { prompt: string; changed: boolean; configuration: any } {
  const taskType = detectTaskType(prompt);
  
  const safetySettings = {
    'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
    'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
    'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
    'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE'
  };
  
  // Adjust based on task type
  if (taskType === 'educational' || taskType === 'professional') {
    safetySettings['HARM_CATEGORY_DANGEROUS_CONTENT'] = 'BLOCK_MEDIUM_AND_ABOVE';
  }
  
  const safetySection = `
## Safety Configuration
This task requires the following safety settings:
- Content filtering: Minimal (technical/professional content)
- Allow technical discussions and code examples
- Maintain professional standards

Safety Settings: ${JSON.stringify(safetySettings, null, 2)}`;
  
  return {
    prompt: prompt + '\n' + safetySection,
    changed: true,
    configuration: { safetySettings }
  };
}

/**
 * Adds grounding instructions for factual accuracy
 */
function addGroundingInstructions(prompt: string): string {
  const groundingSection = `
## Grounding and Citations

When providing information:
1. **Source Verification**: Base responses on reliable, up-to-date sources
2. **Citation Format**: Include references when citing specific facts or data
3. **Confidence Levels**: Indicate certainty levels for different claims
4. **Fact-Checking**: Cross-reference important information

Enable grounding for:
- Technical documentation references
- Statistical data and metrics
- Best practices and standards
- Academic or research findings`;
  
  return prompt + '\n' + groundingSection;
}

/**
 * Optimizes prompt for context caching
 */
function optimizeForContextCaching(prompt: string): string {
  // Split prompt into cacheable and dynamic parts
  const sections = [];
  
  // Identify stable context (cacheable)
  sections.push('## Cached Context (Stable)');
  
  // Extract background, definitions, examples - these are cacheable
  const cacheablePatterns = [
    /(?:Background|Context|Overview):([\s\S]+?)(?=\n##|\n\n|$)/i,
    /(?:Definitions?|Glossary):([\s\S]+?)(?=\n##|\n\n|$)/i,
    /(?:Examples?|Reference):([\s\S]+?)(?=\n##|\n\n|$)/i
  ];
  
  let cachedContent = '';
  let dynamicContent = prompt;
  
  for (const pattern of cacheablePatterns) {
    const match = dynamicContent.match(pattern);
    if (match) {
      cachedContent += match[0] + '\n\n';
      dynamicContent = dynamicContent.replace(match[0], '');
    }
  }
  
  if (cachedContent) {
    sections.push(cachedContent);
    sections.push('## Dynamic Content (Per-Request)');
    sections.push(dynamicContent.trim());
    sections.push('\n## Context Caching Note\nThe stable context above can be cached for efficient reuse across multiple requests.');
    
    return sections.join('\n\n');
  }
  
  return prompt;
}

/**
 * Adds multi-modal processing support
 */
function addMultiModalSupport(prompt: string): string {
  const multiModalSection = `
## Multi-Modal Processing

This task may involve multiple input modalities:

### Supported Inputs:
- **Text**: Primary instructions and context
- **Images**: Visual analysis and understanding
- **Code**: Syntax highlighting and execution
- **Data**: Tables, charts, and structured information

### Processing Guidelines:
1. Analyze each modality in context
2. Integrate insights across modalities
3. Provide unified, coherent responses
4. Reference specific elements when needed`;
  
  return prompt + '\n' + multiModalSection;
}

/**
 * Enhances multi-turn conversation coherence
 */
function enhanceMultiTurnCoherence(prompt: string): string {
  const coherenceSection = `
## Conversation Management

### Context Retention:
- Maintain awareness of previous exchanges
- Reference earlier points when relevant
- Build upon established context

### Response Consistency:
- Keep consistent terminology throughout
- Maintain the same level of technical detail
- Follow established formatting patterns

### Progressive Refinement:
- Each response should advance the conversation
- Clarify ambiguities from previous turns
- Suggest logical next steps`;
  
  return prompt + '\n' + coherenceSection;
}

/**
 * Adds code execution support
 */
function addCodeExecutionSupport(prompt: string): string {
  const codeSection = `
## Code Execution Support

### Execution Environment:
- Python runtime available for calculations and data processing
- Can execute code snippets for validation
- Support for common libraries and frameworks

### Code Guidelines:
1. **Validation**: Test code before presenting
2. **Error Handling**: Include try-catch blocks
3. **Documentation**: Add clear comments
4. **Output Format**: Show both code and results

\`\`\`python
# Example structure
def solution():
    """Docstring explaining the function"""
    try:
        # Implementation
        result = process_data()
        return result
    except Exception as e:
        return f"Error: {e}"

# Execute and show results
result = solution()
print(f"Result: {result}")
\`\`\``;
  
  return prompt + '\n' + codeSection;
}

/**
 * Optimizes markdown structure for Gemini
 */
function optimizeMarkdownStructure(prompt: string): string {
  // Ensure proper markdown hierarchy
  let optimized = prompt;
  
  // Fix heading hierarchy
  optimized = optimized.replace(/^####\s/gm, '### ');
  optimized = optimized.replace(/^#####\s/gm, '#### ');
  
  // Ensure code blocks are properly formatted
  optimized = optimized.replace(/```(\w*)\n/g, '```$1\n');
  
  // Add proper list formatting
  optimized = optimized.replace(/^-\s/gm, '- ');
  optimized = optimized.replace(/^\*\s/gm, '- ');
  
  // Ensure tables are properly formatted
  const tablePattern = /\|.+\|/g;
  if (tablePattern.test(optimized) && !optimized.includes('|---|')) {
    optimized = optimized.replace(/(\|.+\|)\n(\|.+\|)/g, '$1\n|---|---|---|---|---|---|---|---|\n$2');
  }
  
  return optimized;
}

/**
 * Detects the task type for safety configuration
 */
function detectTaskType(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('learn') || promptLower.includes('teach') || promptLower.includes('explain')) {
    return 'educational';
  }
  
  if (promptLower.includes('code') || promptLower.includes('technical') || promptLower.includes('professional')) {
    return 'professional';
  }
  
  if (promptLower.includes('creative') || promptLower.includes('story') || promptLower.includes('generate')) {
    return 'creative';
  }
  
  return 'general';
}

/**
 * Checks if the prompt is long enough for context caching
 */
function isLongContext(prompt: string): boolean {
  return prompt.length > 2000 || prompt.split('\n').length > 50;
}

/**
 * Detects if multi-modal support is needed
 */
function detectMultiModalNeed(prompt: string): boolean {
  const multiModalKeywords = [
    'image', 'picture', 'visual', 'diagram', 'chart',
    'video', 'audio', 'file', 'document', 'attachment'
  ];
  
  const promptLower = prompt.toLowerCase();
  return multiModalKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Detects if code execution might be needed
 */
function detectCodeExecutionNeed(prompt: string): boolean {
  const codeKeywords = [
    'calculate', 'compute', 'run', 'execute', 'test',
    'validate', 'algorithm', 'function', 'code', 'program'
  ];
  
  const promptLower = prompt.toLowerCase();
  return codeKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Creates Gemini-specific example format
 */
function createGeminiExample(input: string, output: string, context: any = null): string {
  const example: any = {
    input: input,
    output: output
  };
  
  if (context) {
    example.context = context;
  }
  
  return `
### Example:
**Input**: ${input}
${context ? `**Context**: ${context}` : ''}
**Output**: ${output}
`;
}

export {
  optimizeForGemini,
  addSafetyConfiguration,
  addGroundingInstructions,
  optimizeForContextCaching,
  addMultiModalSupport,
  enhanceMultiTurnCoherence,
  addCodeExecutionSupport,
  optimizeMarkdownStructure,
  detectTaskType,
  isLongContext,
  detectMultiModalNeed,
  detectCodeExecutionNeed,
  createGeminiExample
};