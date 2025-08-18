export async function addXmlStructure(prompt) {
  // If already has good XML structure, enhance it
  if (/<task>.*<\/task>/is.test(prompt)) {
    return enhanceExistingStructure(prompt);
  }
  
  // Detect prompt type and structure accordingly
  const isTroubleshooting = /(?:not seeing|not working|issue|problem|error|concern|troubleshoot|debug|fix)/i.test(prompt);
  const hasLogs = /(?:logs?|output|console|trace|stack)/i.test(prompt);
  
  if (isTroubleshooting) {
    return structureTroubleshootingPrompt(prompt, hasLogs);
  }
  
  // Otherwise, wrap in standard XML structure
  return `<task>
<objective>${extractObjective(prompt)}</objective>

<context>
${extractContext(prompt)}
</context>

<requirements>
${extractRequirements(prompt)}
</requirements>

<implementation_details>
${extractImplementationDetails(prompt)}
</implementation_details>
</task>`;
}

function structureTroubleshootingPrompt(prompt, hasLogs) {
  const sections = [];
  
  // Extract problem statement
  const problemStatement = extractProblemStatement(prompt);
  sections.push(`<problem>\n${problemStatement}\n</problem>`);
  
  // Extract environment/context
  const context = extractTroubleshootingContext(prompt);
  if (context) {
    sections.push(`<environment>\n${context}\n</environment>`);
  }
  
  // Extract logs/diagnostic data
  if (hasLogs) {
    const logs = extractLogs(prompt);
    if (logs) {
      sections.push(`<diagnostic_data>\n${logs}\n</diagnostic_data>`);
    }
  }
  
  // Add investigation steps
  sections.push(`<investigation_steps>
1. Verify service connectivity and configuration
2. Check application logs for errors or warnings
3. Test API endpoints directly
4. Review environment variables and secrets
5. Validate network communication between services
</investigation_steps>`);
  
  // Add success criteria
  sections.push(`<success_criteria>
- Issue identified and documented
- Root cause determined
- Solution implemented and tested
- System functioning as expected
</success_criteria>`);
  
  return `<troubleshooting>\n${sections.join('\n\n')}\n</troubleshooting>`;
}

function extractProblemStatement(prompt) {
  // Extract the first sentence or line that describes the problem
  const lines = prompt.split(/[.\n]/);
  const problemLine = lines.find(line => {
    const trimmed = line.trim();
    return trimmed.length > 10 && /(?:concern|issue|problem|not|error)/i.test(trimmed);
  });
  
  return problemLine?.trim() || prompt.split('\n')[0].trim();
}

function extractTroubleshootingContext(prompt) {
  // Look for technology mentions
  const techKeywords = /(docker|kubernetes|langfuse|redis|postgres|api|server|service|local|production)/gi;
  const matches = prompt.match(techKeywords);
  
  if (matches && matches.length > 0) {
    const uniqueTech = [...new Set(matches.map(m => m.toLowerCase()))];
    return `- Environment: ${uniqueTech.includes('local') ? 'Local development' : 'Production'}\n` +
           `- Technologies: ${uniqueTech.filter(t => t !== 'local').join(', ')}\n` +
           `- Components involved: ${extractComponents(prompt)}`;
  }
  
  return null;
}

function extractComponents(prompt) {
  const componentPatterns = /(?:worker|server|database|cache|api|frontend|backend|service)/gi;
  const matches = prompt.match(componentPatterns);
  
  if (matches) {
    return [...new Set(matches)].join(', ');
  }
  
  return 'Unknown components';
}

function extractLogs(prompt) {
  const lines = prompt.split('\n');
  const logLines = [];
  let inLogSection = false;
  
  for (const line of lines) {
    // Detect log section start
    if (/(?:logs?|output|console):/i.test(line)) {
      inLogSection = true;
      continue;
    }
    
    // Collect log lines (usually contain | or timestamps)
    if (inLogSection || line.includes('|') || /\d{4}-\d{2}-\d{2}/.test(line)) {
      if (line.trim()) {
        logLines.push(line);
      }
    }
  }
  
  return logLines.length > 0 ? logLines.join('\n') : null;
}

function enhanceExistingStructure(prompt) {
  // Add missing sections if needed
  let enhanced = prompt;
  
  if (!/<context>/i.test(enhanced)) {
    enhanced = enhanced.replace(/<task>/i, '<task>\n<context>\n[Extract context from prompt]\n</context>\n');
  }
  
  if (!/<requirements>/i.test(enhanced)) {
    enhanced = enhanced.replace(/<\/task>/i, '\n<requirements>\n[Extract requirements]\n</requirements>\n</task>');
  }
  
  return enhanced;
}

function extractObjective(prompt) {
  // Extract the main objective from the prompt
  const lines = prompt.split('\n');
  const firstLine = lines.find(line => line.trim().length > 0);
  return firstLine || 'Define the main objective clearly';
}

function extractContext(prompt) {
  // Extract context information more intelligently
  const contextIndicators = [
    /(?:using|with|in|on)\s+(\w+(?:\s+\w+)*)/gi,
    /(?:environment|setup|configuration):\s*(.+)/gi,
    /(?:tech stack|technology|framework):\s*(.+)/gi
  ];
  
  const contextItems = [];
  
  for (const pattern of contextIndicators) {
    const matches = [...prompt.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        contextItems.push(`- ${match[1].trim()}`);
      }
    }
  }
  
  // Look for technology keywords
  const techKeywords = /(docker|kubernetes|react|vue|angular|node|python|java|aws|azure|gcp)/gi;
  const techMatches = prompt.match(techKeywords);
  if (techMatches) {
    const uniqueTech = [...new Set(techMatches)];
    contextItems.push(`- Technologies: ${uniqueTech.join(', ')}`);
  }
  
  if (contextItems.length > 0) {
    return contextItems.join('\n');
  }
  
  return '- Define the technical context\n- Specify constraints\n- Mention the tech stack';
}

function extractRequirements(prompt) {
  // Extract requirements more intelligently
  const requirementPatterns = [
    /(?:must|should|need to|required to|have to)\s+(.+?)(?:\.|,|\n|$)/gi,
    /(?:ensure|make sure|verify)\s+(.+?)(?:\.|,|\n|$)/gi,
    /(?:requirement|criteria):\s*(.+?)(?:\.|,|\n|$)/gi
  ];
  
  const requirements = [];
  
  for (const pattern of requirementPatterns) {
    const matches = [...prompt.matchAll(pattern)];
    for (const match of matches) {
      if (match[1]) {
        requirements.push(`- ${match[1].trim()}`);
      }
    }
  }
  
  if (requirements.length > 0) {
    return `EXTRACTED REQUIREMENTS:\n${requirements.join('\n')}`;
  }
  
  return `MUST HAVE:
- Core functionality
- Error handling
- Performance requirements

SHOULD HAVE:
- Additional features
- Optimizations`;
}

function extractImplementationDetails(prompt) {
  // Extract any code snippets, configuration, or specific details
  const lines = prompt.split('\n');
  const detailLines = [];
  
  for (const line of lines) {
    // Skip if already extracted as objective or requirement
    if (line === extractObjective(prompt)) continue;
    
    // Look for implementation-specific content
    if (line.includes('|') || // Log lines
        line.includes(':') || // Configuration lines
        /^\s*[-*]\s/.test(line) || // Bullet points
        /^\s*\d+\.\s/.test(line)) { // Numbered lists
      detailLines.push(line);
    }
  }
  
  return detailLines.length > 0 ? detailLines.join('\n') : 'Provide specific implementation guidance';
}